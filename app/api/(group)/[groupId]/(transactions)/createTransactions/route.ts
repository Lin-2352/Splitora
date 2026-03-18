import { z } from "zod";
import { NextResponse, NextRequest } from "next/server";
import mongoose from "mongoose";
import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";

import BillSchema from "@/models/billSchema";
import groupSchema from "@/models/groupSchema";
import TransactionSchema from "@/models/TransactionSchema";

const createTransactionSchema = z.object({
    billId: z.string().optional(),
    amount: z.number().positive(),
    description: z.string().min(1),
    splitType: z.enum(['equal', 'exact', 'percentage', 'shares']),
    splits: z.array(z.object({
        user: z.string(),
        amount: z.number().positive().optional(),
        percentage: z.number().positive().optional(),
        shares: z.number().positive().optional()
    })).min(1)
});

const roundToTwo = (value: number) => Number(value.toFixed(2));
const hasMoreThanTwoDecimals = (value: number) => Math.abs((value * 100) - Math.round(value * 100)) > 1e-8;

export async function POST(req: NextRequest, context: { params: Promise<{ groupId: string }> }) {
    await createMongoConnection();

    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authData = verifyToken(token);
    if (!authData) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = createTransactionSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { billId, amount, description, splitType, splits } = validation.data;
    if (hasMoreThanTwoDecimals(amount)) {
        return NextResponse.json({ error: 'Amount can have at most 2 decimal places' }, { status: 400 });
    }

    const normalizedAmount = roundToTwo(amount);
    const payerId = authData.userId;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
            const { groupId } = await context.params;
            const group = await groupSchema.findOne(
                {
                    _id: groupId,
                    "members.user": payerId
                }
            ).session(session);

            if (!group) {
                await session.abortTransaction();
                return NextResponse.json({ error: 'Group not found or access denied' }, { status: 404 });
            }

            const groupMemberIds = group.members.map((m: { user: mongoose.Types.ObjectId }) => m.user.toString());

            for (const split of splits) {
                if (!groupMemberIds.includes(split.user)) {
                    await session.abortTransaction();
                    return NextResponse.json(
                        { error: "One or more split users are not members of this group" },
                        { status: 400 }
                    );
                }
            }

            let processedSplits: any[] = [];

            if (splitType === 'equal') {
                const baseAmount = roundToTwo(normalizedAmount / splits.length);
                const totalAssigned = roundToTwo(baseAmount * splits.length);
                const remainder = roundToTwo(normalizedAmount - totalAssigned);

                processedSplits = splits.map((split, index) => ({
                    user: split.user,
                    amount: index === 0 
                        ? roundToTwo(baseAmount + remainder)
                        : baseAmount
                }));
            }

            if (splitType === 'exact') {
                const invalidSplitAmount = splits.some(split => split.amount === undefined || hasMoreThanTwoDecimals(split.amount));
                if (invalidSplitAmount) {
                    await session.abortTransaction();
                    return NextResponse.json({ error: 'Exact split amounts must be provided with at most 2 decimal places' }, { status: 400 });
                }

                const total = roundToTwo(splits.reduce((sum, split) => sum + (split.amount || 0), 0));
                if (total !== normalizedAmount) {
                    await session.abortTransaction();
                    return NextResponse.json({ error: 'Total split amount must equal transaction amount' }, { status: 400 });
                }
                processedSplits = splits.map(split => ({
                    user: split.user,
                    amount: roundToTwo(split.amount!)
                }));
            }

            if (splitType === 'percentage') {
                const totalPercentage = splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
                if (totalPercentage !== 100) {
                    await session.abortTransaction();
                    return NextResponse.json({ error: 'Total split percentage must equal 100%' }, { status: 400 });
                }
                processedSplits = splits.map(split => ({
                    user: split.user,
                    amount: roundToTwo((split.percentage! / 100) * normalizedAmount)
                }));
            }

            if (splitType === 'shares') {
                const totalShares = splits.reduce((sum, split) => sum + (split.shares || 0), 0);
                if (totalShares === 0) {
                    await session.abortTransaction();
                    return NextResponse.json({ error: 'Total shares must be greater than 0' }, { status: 400 });
                }
                processedSplits = splits.map(split => ({
                    user: split.user,
                    amount: roundToTwo((split.shares! / totalShares) * normalizedAmount)
                }));
            }

            let bill: any = null;
            if (billId) {
                bill = await BillSchema.findOne({
                    _id: billId,
                    groupId: group._id
                }).session(session);

                if (!bill) {
                    await session.abortTransaction();
                    return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
                }

                if (bill.isConverted) {
                    await session.abortTransaction();
                    return NextResponse.json({ error: 'Bill has already been converted to a transaction' }, { status: 400 });
                }
            }

            const transcation = new TransactionSchema({
                groupMongooseId: group._id,
                payer: payerId,
                bill: billId || null,
                amount: normalizedAmount,
                description,
                splitType,
                splits: processedSplits,
                status: 'completed'
            })

            await transcation.save({ session });

            if (bill) {
                bill.transaction = transcation._id;
                bill.isConverted = true;
                await bill.save({ session });

            }
            await session.commitTransaction();
            session.endSession();
            return NextResponse.json({ message: 'Transaction created successfully', transactionId: transcation._id }, { status: 201 });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('Error creating transaction:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
}