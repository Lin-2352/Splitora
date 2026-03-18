import { NextResponse, NextRequest } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";
import groupSchema from "@/models/groupSchema";
import "@/models/userSchema"; // Side-effect import required for Mongoose populate
import mongoose from "mongoose";

export async function GET(req: NextRequest, context: { params: Promise<{ groupId: string }> }) {
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
        const params = await context.params;
        const userId = authData.userId;
        const groupId = params.groupId;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
        }   

        const group = await groupSchema
            .findOne({ _id: groupId, "members.user": userId })
            .populate('members.user', 'userName email') 
            .select('groupName inviteCode members');

        if (!group) {
            return NextResponse.json({ error: "Group not found or you are not a member of this group" }, { status: 404 });
        }
        return NextResponse.json({ group }, { status: 200 });
    }
    catch (error) {
        console.error("Error fetching group:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}