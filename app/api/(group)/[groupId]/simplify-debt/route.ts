import { NextRequest, NextResponse } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";

import settleSchema from "@/models/settleSchema";
import TransactionSchema from "@/models/TransactionSchema";
import Group from "@/models/groupSchema";


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
        const { groupId } = await context.params;
        
        const group = await Group.findOne({
            _id: groupId,
            "members.user": authData.userId
        });
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }
        const transactions = await TransactionSchema.find({ groupMongooseId: groupId });
        const settlements = await settleSchema.find({ groupMongooseId: groupId });

        const balanceMap: Record<string, number> = {};
        group.members.forEach((member: any) => {
            balanceMap[member.user.toString()] = 0;
        });

        for (const tx of transactions) {
            const payer = tx.payer.toString();

            for (const split of tx.splits) {
                const user = split.user.toString();
                const amount = split.amount;

                if (user === payer) continue;

                balanceMap[user] -= amount;
                balanceMap[payer] += amount;
            }
        }

        for (const st of settlements) {
            const from = st.fromUser.toString();
            const to = st.toUser.toString();

            balanceMap[from] += st.amount;
            balanceMap[to] -= st.amount;
        }

        const creditors: any[] = [];
        const debtors: any[] = [];

        for (const user in balanceMap) {
            if (balanceMap[user] > 0) creditors.push({ user, amount: balanceMap[user] });
            else if (balanceMap[user] < 0) debtors.push({ user, amount: -balanceMap[user] });
        }


        const settlementsResult: any[] = [];

        while (creditors.length && debtors.length) {
            const creditor = creditors[0];
            const debtor = debtors[0];

            const payment = Math.min(creditor.amount, debtor.amount);

            settlementsResult.push({
                from: debtor.user,
                to: creditor.user,
                amount: Number(payment.toFixed(2))
            });

            creditor.amount -= payment;
            debtor.amount -= payment;

            if (Math.abs(creditor.amount) < 0.01) creditors.shift();
            if (Math.abs(debtor.amount) < 0.01) debtors.shift();
        }

        return NextResponse.json(
            { simplifiedDebts: settlementsResult },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error occurred while simplifying debt:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}