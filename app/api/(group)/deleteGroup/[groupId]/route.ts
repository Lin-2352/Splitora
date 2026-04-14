import groupSchema from "@/models/groupSchema"; 
import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
    await createMongoConnection();

    const token = req.headers.get('Authorization')?.split(' ')[1];  
    if (!token) {
        return NextResponse.json({ error: "Authorization token is missing" }, { status: 401 });
    }

    const authData = verifyToken(token);
    if (!authData) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const resolvedParams = await params;
    const userId = authData.userId;
    const groupId = resolvedParams.groupId;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
    }

    try {
        const deleteGroup = await groupSchema.findOneAndDelete({
            _id: groupId,
            members: {
                $elemMatch: {
                    user: userId,
                    role: 'groupLeader'
                }
            }
        });
        if (!deleteGroup) {
            return NextResponse.json({ error: "Group not found or you are not the leader" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Group deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting group:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}