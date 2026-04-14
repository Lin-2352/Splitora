import { NextResponse, NextRequest } from "next/server";
import mongoose from "mongoose";
import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";

import TransactionSchema from "@/models/TransactionSchema";
import groupSchema from "@/models/groupSchema";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string, transactionId: string }> }) {
    await createMongoConnection();

    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authData = verifyToken(token);
    if (!authData) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { groupId, transactionId } = await params;
        const userId = authData.userId;

        const group = await groupSchema.findOne(
            { _id: groupId, "members.user": userId }
        );
        if (!group) {
            return NextResponse.json({ error: 'Group not found or unauthorized' }, { status: 404 });
        }

        const transaction = await TransactionSchema.findOne({ _id: transactionId, groupMongooseId: groupId });
        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Only the payer or group leader can delete the transaction
        const isGroupLeader = group.members.some(
            (member: { user: mongoose.Types.ObjectId, role: string }) =>
                member.user.toString() === userId && member.role === 'groupLeader'
        );

        if (transaction.payer.toString() !== userId && !isGroupLeader) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await TransactionSchema.deleteOne({ _id: transactionId });
        return NextResponse.json({ message: 'Transaction deleted successfully' }, { status: 200 });

        } catch (error) {
            console.error(error);   
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    
}