import { NextResponse, NextRequest } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";
import TransactionSchema from "@/models/TransactionSchema";
import groupSchema from "@/models/groupSchema";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ groupId: string }> }
) {
    await createMongoConnection();

    const token = request.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authData = verifyToken(token);
    if (!authData) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { groupId } = await context.params;

        // Verify the user is a member of this group
        const group = await groupSchema.findOne({
            _id: groupId,
            "members.user": authData.userId,
        });
        if (!group) {
            return NextResponse.json(
                { error: "Group not found or unauthorized" },
                { status: 404 }
            );
        }

        // Fetch all completed transactions for this group
        const transactions = await TransactionSchema.find({
            groupMongooseId: groupId,
        }).lean();

        if (!transactions || transactions.length === 0) {
            return NextResponse.json({
                tip: "Start adding expenses to get personalized AI insights! 🚀",
            });
        }

        // Map to the ML service's expected format
        const mlTransactions = transactions.map((tx: any) => ({
            name: tx.description || "Unknown",
            amount: Math.abs(tx.amount || 0),
            category: tx.category || "Other",
        }));

        // Call the ML recommendation service
        const mlRes = await fetch(`${ML_SERVICE_URL}/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactions: mlTransactions }),
        });

        if (!mlRes.ok) {
            console.error("ML service error:", mlRes.status, await mlRes.text());
            return NextResponse.json(
                { tip: "AI insights are temporarily unavailable. Please try again later." },
                { status: 200 }
            );
        }

        const data = await mlRes.json();
        return NextResponse.json({ tip: data.tip });
    } catch (error) {
        console.error("Recommendations error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
