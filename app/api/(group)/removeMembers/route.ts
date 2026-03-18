import { NextRequest, NextResponse } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";
import groupSchema from "@/models/groupSchema";
import mongoose from "mongoose";

export async function DELETE(req: NextRequest) {
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

        const userId = authData.userId;
        // we will get the groupId and the memberIds to be removed from the request body
        const { groupId, memberIds } = await req.json();
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
        }

        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            return NextResponse.json({ error: "memberIds must be a non-empty array" }, { status: 400 });
        }

        if (memberIds.includes(userId)) {
            return NextResponse.json({ error: "Leader cannot remove himself" }, { status: 400 });
        }

        const group = await groupSchema.findOne({ _id: groupId, "members.user": userId, "members.role": "groupLeader" });
        
        if (!group) {
            return NextResponse.json({ error: "Group not found or you are not the group leader" }, { status: 404 });
        }
        
        group.members = group.members.filter((member: any) => !memberIds.includes(member.user.toString()));
        await group.save();
        return NextResponse.json({ message: "Members removed successfully" }, { status: 200 });
    }
    catch (error) {
        console.error("Error removing members:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}