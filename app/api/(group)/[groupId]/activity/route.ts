import { NextRequest, NextResponse } from "next/server";

import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";

import Transaction from "@/models/TransactionSchema";
import Settlement from "@/models/settleSchema";
import Group from "@/models/groupSchema";
import "@/models/userSchema";

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {

  try {

    await createMongoConnection();

    const token = req.headers.get("Authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authData = verifyToken(token);

    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    const group = await Group.findOne({
      _id: groupId,
      "members.user": authData.userId
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found or unauthorized" },
        { status: 404 }
      );
    }

    const transactions = await Transaction.find({
      groupMongooseId: groupId
    })
      .populate("payer", "userName email")
      .sort({ createdAt: -1 });

    const settlements = await Settlement.find({
      groupMongooseId: groupId
    })
      .populate("fromUser", "userName email")
      .populate("toUser", "userName email")
      .sort({ settleAt: -1 });

    const transactionActivity = transactions.map((tx) => ({
      type: "transaction",
      description: `${tx.payer.userName} paid ₹${tx.amount} for ${tx.description}`,
      createdAt: tx.createdAt
    }));

    const settlementActivity = settlements.map((st) => ({
      type: "settlement",
      description: `${st.fromUser.userName} settled ₹${st.amount} with ${st.toUser.userName}`,
      createdAt: st.settleAt
    }));

    const activity = [...transactionActivity, ...settlementActivity];

    activity.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ activity }, { status: 200 });

  } catch (error) {

    console.error("Activity error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
