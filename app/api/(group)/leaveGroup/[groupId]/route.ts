import { NextRequest, NextResponse } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";
import groupSchema from "@/models/groupSchema";
import mongoose from "mongoose";

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ groupId: string }> }
) {
    await createMongoConnection();

    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ error: "Authorization token is missing" }, { status: 401 });
    }

    const authData = verifyToken(token);
    if (!authData) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    try {
        const { groupId } = await context.params;
        const userId = authData.userId;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
        }

        const group = await groupSchema.findById(groupId);
        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        // Check if user is in group
        const memberIndex = group.members.findIndex((m: any) => m.user.toString() === userId);
        if (memberIndex === -1) {
            return NextResponse.json({ error: "You are not a member of this group" }, { status: 400 });
        }

        // Leader cannot leave, they must delete or transfer ownership (transfer not implemented yet)
        if (group.members[memberIndex].role === "groupLeader") {
            return NextResponse.json({ error: "Group leaders cannot leave the group. You must delete the group instead." }, { status: 400 });
        }

        // Remove the member
        group.members.splice(memberIndex, 1);
        await group.save();

        return NextResponse.json({ message: "Successfully left the group" }, { status: 200 });
    }
    catch (error) {
        console.error("Error leaving group:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
