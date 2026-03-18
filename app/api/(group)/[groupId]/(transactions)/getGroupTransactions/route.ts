import { NextResponse, NextRequest } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";
import TransactionSchema from "@/models/TransactionSchema";
import groupSchema from "@/models/groupSchema";

export async function GET(req: NextRequest, context: { params: Promise<{ groupId: string }> }) {
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
        const { groupId } = await context.params;
        const group = await groupSchema.findOne(
            { _id: groupId, "members.user": authData.userId },
        );
        if (!group) {
            return NextResponse.json({ error: 'Group not found or unauthorized' }, { status: 404 });
        }
        const transactions = await TransactionSchema.find({ groupMongooseId: groupId })
            .populate('payer', 'name email')
            .populate('bill', 'merchant totalAmount')
            .sort({ createdAt: -1 });

        return NextResponse.json({ transactions }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}