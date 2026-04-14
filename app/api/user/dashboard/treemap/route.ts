import { NextRequest, NextResponse } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";

import groupSchema from "@/models/groupSchema";
import TransactionSchema from "@/models/TransactionSchema";
import settleSchema from "@/models/settleSchema";

export async function GET(request: NextRequest) {
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

        const groups = await groupSchema.find({ "members.user": authData.userId });
        const result: any[] = [];

        for (const group of groups) {
            const transactions = await TransactionSchema.find({ groupMongooseId: group._id });
            const settlements = await settleSchema.find({ groupMongooseId: group._id });

            let balance = 0;

            for (const tx of transactions) {
                if (tx.payer.toString() === authData.userId) {
                    tx.splits.forEach((split: any) => {
                        if (split.user.toString() !== authData.userId)
                            balance += split.amount;
                    });
                }

                tx.splits.forEach((split: any) => {
                    if (split.user.toString() === authData.userId && tx.payer.toString() !== authData.userId)
                        balance -= split.amount;
                });

            }

            for (const st of settlements) {

                if (st.fromUser.toString() === authData.userId)
                    balance += st.amount;

                if (st.toUser.toString() === authData.userId)
                    balance -= st.amount;

            }  
            
            result.push({
                groupId: group._id,
                groupName: group.groupName,
                amount: balance
            });
        }

        return NextResponse.json(
            { groups: result },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error occurred while fetching group balances:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}