// It creates multiple settlement records in one request.
// You can implement a “Settle All Debts” button like:

// Simplify Debts
//       ↓
// Settle All
//       ↓
// POST /settle/bulk

import { NextRequest, NextResponse } from "next/server";

import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";

import Settlement from "@/models/settleSchema";
import Group from "@/models/groupSchema";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
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

    const { groupId } = await context.params;

    const body = await req.json();
    const  settlements  = body.settlements  || body.simplifiedDebts;

    if (!settlements || settlements.length === 0) {
      return NextResponse.json(
        { error: "No settlements provided" },
        { status: 400 }
      );
    }

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

    const settlementDocs = settlements.map((s: any) => ({
      groupMongooseId: groupId,
      fromUser: s.fromUser || s.from,
      toUser: s.toUser || s.to,
      amount: Number(Number(s.amount).toFixed(2))
    }));

    const createdSettlements = await Settlement.insertMany(settlementDocs);

    return NextResponse.json(
      {
        message: "Settlements recorded successfully",
        settlements: createdSettlements
      },
      { status: 201 }
    );

  } catch (error) {

    console.error("Bulk settlement error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );

  }
}