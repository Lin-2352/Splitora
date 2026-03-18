import { NextRequest, NextResponse } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";
import mongoose from "mongoose";

import TransactionSchema from "@/models/TransactionSchema";
import { verifyToken } from "@/middleware/auth";

export async function GET(req: NextRequest) {
    try {
        await createMongoConnection();
        const token = req.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const authData = verifyToken(token);
    
        if (!authData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = authData.userId;
        const userObjId = new mongoose.Types.ObjectId(userId);

        const { searchParams } = new URL(req.url);
        const range = searchParams.get("range") || "week";
        const groupId = searchParams.get("groupId"); // Optional: filter by group

        let startDate = new Date();
        if (range === "week") startDate.setDate(startDate.getDate() - 7);
        if (range === "month") startDate.setMonth(startDate.getMonth() - 1);
        if (range === "year") startDate.setFullYear(startDate.getFullYear() - 1);

        let groupFormat: any;
        if (range === "week") groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        if (range === "month") groupFormat = { $dateToString: { format: "%Y-%U", date: "$createdAt" } };
        if (range === "year") groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };

        // Base match filter
        const baseMatch: any = { createdAt: { $gte: startDate } };
        if (groupId) {
            baseMatch.groupMongooseId = new mongoose.Types.ObjectId(groupId);
        }

        // --- CREDIT: Transactions where I am the payer ---
        // Credit = total of OTHER people's splits (money they owe me)
        const creditPipeline = await TransactionSchema.aggregate([
            { $match: { ...baseMatch, payer: userObjId } },
            { $unwind: "$splits" },
            // Exclude my own split (I don't owe myself)
            { $match: { "splits.user": { $ne: userObjId } } },
            {
                $group: {
                    _id: groupFormat,
                    credit: { $sum: "$splits.amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // --- SPENDING: Transactions where someone else paid, but I'm in the splits ---
        // Spending = my split amount in expenses others created
        const spendingPipeline = await TransactionSchema.aggregate([
            { $match: { ...baseMatch, payer: { $ne: userObjId } } },
            { $unwind: "$splits" },
            { $match: { "splits.user": userObjId } },
            {
                $group: {
                    _id: groupFormat,
                    spending: { $sum: "$splits.amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Merge both into a single timeline
        const timeMap: Record<string, { credit: number; spending: number; creditCount: number; spendingCount: number }> = {};

        for (const c of creditPipeline) {
            const key = String(c._id);
            if (!timeMap[key]) timeMap[key] = { credit: 0, spending: 0, creditCount: 0, spendingCount: 0 };
            timeMap[key].credit = c.credit;
            timeMap[key].creditCount = c.count;
        }

        for (const s of spendingPipeline) {
            const key = String(s._id);
            if (!timeMap[key]) timeMap[key] = { credit: 0, spending: 0, creditCount: 0, spendingCount: 0 };
            timeMap[key].spending = s.spending;
            timeMap[key].spendingCount = s.count;
        }

        // Sort by date key and build result
        const sortedKeys = Object.keys(timeMap).sort();
        const dataPoints = sortedKeys.map(key => ({
            date: key,
            credit: Number(timeMap[key].credit.toFixed(2)),
            spending: Number(timeMap[key].spending.toFixed(2)),
            creditCount: timeMap[key].creditCount,
            spendingCount: timeMap[key].spendingCount
        }));

        const totalCredit = dataPoints.reduce((sum, d) => sum + d.credit, 0);
        const totalSpending = dataPoints.reduce((sum, d) => sum + d.spending, 0);

        return NextResponse.json({
            range,
            totalCredit,
            totalSpending,
            dataPoints
        }, { status: 200 });
    }
    catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}