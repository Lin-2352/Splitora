import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import createMongoConnection from '@/middleware/mongoDB';
import { verifyToken } from '@/middleware/auth';

import billSchema from '@/models/billSchema';
import Transaction from '@/models/TransactionSchema';
import groupSchema from '@/models/groupSchema';

export async function POST(request: NextRequest, context: { params: Promise<{ groupId: string, billId: string }> }) {
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
        const userId = authData.userId;
        const { groupId, billId } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(billId)) {
            return NextResponse.json({ error: 'Invalid bill ID' }, { status: 400 });
        }

        const bill = await billSchema.findOne({ _id: billId, groupMongooseId: groupId });
        if (!bill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
        }

        if (bill.isConverted) {
            return NextResponse.json({ error: 'Bill has already been converted' }, { status: 400 });
        }

        if (bill.status !== 'completed') {
            return NextResponse.json({ error: 'Bill is not completed' }, { status: 400 });
        }

        const group = await groupSchema.findOne({ _id: groupId, "members.user": userId });

        if (!group) {
            return NextResponse.json({ error: 'Group not found or unauthorized' }, { status: 404 });
        }

        const members = group.members.map((member: any) => member.user.toString());

        if (members.length === 0 || !members) {
            return NextResponse.json({ error: 'No members found in the group' }, { status: 404 });
        }

        const totalAmount = bill.totalAmount;
        const splitAmount = parseFloat((totalAmount / members.length).toFixed(2));

        const splits = members.map((memberId: mongoose.Types.ObjectId) => ({
            user: memberId,
            amount: splitAmount
        }));

        const transaction = new Transaction({
            groupMongooseId: groupId,
            bill: bill._id,
            payer: bill.payer,
            amount: totalAmount,
            description: bill.description,
            splitType: "equal",
            item: bill.items,
            splits: splits,
            status: "completed"
        });

        await transaction.save();

        bill.transactions = transaction._id;
        bill.isConverted = true;

        await bill.save()

        return NextResponse.json({ message: 'Bill converted to transaction successfully' }, { status: 200 });

    } catch (error) {
        console.error('Error converting bill:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}