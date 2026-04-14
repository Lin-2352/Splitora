import { NextRequest, NextResponse } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";
import settleSchema from "@/models/settleSchema";
import TransactionSchema from "@/models/TransactionSchema";
import Group from "@/models/groupSchema";

export async function GET(request: NextRequest, context: { params: Promise<{ groupId: string }> }) {
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

        const balanceMap: Record<string, Record<string, number>> = {};

        group.members.forEach((member: any) => {
            balanceMap[member.user.toString()] = {};
        });

        for (const tx of transactions) {
            const payer = tx.payer.toString();

            for (const split of tx.splits) {
                const user = split.user.toString();

                if (user === payer) continue;

                if (!balanceMap[payer][user]) balanceMap[payer][user] = 0;
                    balanceMap[payer][user] += split.amount;
            }
        }

        for (const st of settlements) {
            const from = st.fromUser.toString();
            const to = st.toUser.toString();

            if (!balanceMap[to][from]) balanceMap[to][from] = 0;
                balanceMap[to][from] -= st.amount;
        }


        const result: any[] = [];
        const visited = new Set();

        for (const userA in balanceMap) {
            for (const userB in balanceMap[userA]) {
                if (visited.has(userA + userB) || visited.has(userB + userA)) continue;

                const aToB = balanceMap[userA][userB] || 0;
                const bToA = balanceMap[userB]?.[userA] || 0;

                const net = aToB - bToA;

                if (net > 0) {
                    result.push({
                        from: userB,
                        to: userA,
                        amount: Number(net.toFixed(2))
                    });
                }

                if (net < 0) {
                    result.push({
                        from: userA,
                        to: userB,
                        amount: Number(Math.abs(net).toFixed(2))
                    });
                }

                visited.add(userA + userB);
                visited.add(userB + userA);
            }
        }
        
        return NextResponse.json({ balances: result }, { status: 200 });
        
    } catch (error) {
        console.error('Error fetching group balance:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}