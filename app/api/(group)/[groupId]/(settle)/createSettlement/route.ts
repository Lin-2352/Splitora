import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import settleSchema from "@/models/settleSchema";
import Group from "@/models/groupSchema";
import Transaction from "@/models/TransactionSchema";

import mongoose from "mongoose";
import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";


const settleValidationSchema = z.object({
    toUser: z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
        message: "Invalid toUser ID",
    }),
    amount: z.number().positive("Amount must be a positive number"),
});


export async function POST(request: NextRequest, context: { params: Promise<{ groupId: string }> }) {
    try {
        await createMongoConnection();
        const token = request.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const authData = verifyToken(token);
        if (!authData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const fromUser = authData.userId;
        
        const { groupId } = await context.params;
        const body = await request.json();
        const validation = settleValidationSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        
        const {toUser, amount } = validation.data;
        
        const group = await Group.findOne({
            _id: groupId,
            "members.user": fromUser
        });

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        if (fromUser === toUser) {
            return NextResponse.json(
                { error: "Cannot settle with yourself" },
                { status: 400 }
            );
        }

        if (!group.members.some((member: any) => member.user.toString() === fromUser)) {
            return NextResponse.json({ error: 'From user is not a member of the group' }, { status: 400 });
        }

        if (!group.members.some((member: any) => member.user.toString() === toUser)) {
            return NextResponse.json({ error: 'To user is not a member of the group' }, { status: 400 });
        }

        const transactions = await Transaction.find({
            groupMongooseId: groupId,
            status: "completed",
        }).lean();

        const settlements = await settleSchema.find({
            groupMongooseId: groupId,
        }).lean();

        const balances: Record<string, number> = {};

        for (const member of group.members) {
            balances[member.user.toString()] = 0;
        }

        for (const tx of transactions) {
            const payer = tx.payer.toString();

            balances[payer] += tx.amount;

            for (const split of tx.splits) {
                const userId = split.user.toString();
                balances[userId] -= split.amount || 0;
            }
        }

        // Include existing settlements in balance calculation
        for (const st of settlements) {
            const from = st.fromUser.toString();
            const to = st.toUser.toString();

            balances[from] += st.amount;  // fromUser paid, so their debt decreases (balance increases)
            balances[to] -= st.amount;    // toUser received, so they're owed less (balance decreases)
        }

        const fromBalance = balances[fromUser];
        const toBalance = balances[toUser];

        if (fromBalance >= 0) {
            return NextResponse.json(
                { error: "You do not owe any money in this group" },
                { status: 400 }
            );
        }

        if (toBalance <= 0) {
            return NextResponse.json(
                { error: "Selected user is not owed money" },
                { status: 400 }
            );
        }

        if (Math.abs(fromBalance) < amount) {
            return NextResponse.json(
                { error: "Settlement amount exceeds your debt" },
                { status: 400 }
            );
        }

        const newSettle = new settleSchema({
            groupMongooseId: groupId,
            fromUser,
            toUser,
            amount,
            settleAt: new Date()
        });

        await newSettle.save();
        // await session.commitTransaction();
        // session.endSession();

        return NextResponse.json({ message: 'Settlement created successfully' }, { status: 201 });
    } catch (error) {
        // await session.abortTransaction();
        // session.endSession();
        console.error('Error creating settlement:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
