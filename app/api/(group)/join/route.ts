import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import createMongoConnection from "@/middleware/mongoDB";
import Group from "@/models/groupSchema";
import User from "@/models/userSchema";
import { verifyToken } from "@/middleware/auth";

const joinGroupSchema = z.object({
    inviteCode: z.string().trim().length(8)
})

export async function POST(req: NextRequest) {
    await createMongoConnection();

    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        return NextResponse.json({ error: "Authorization token is missing" }, { status: 401 });
    }
    const authData = verifyToken(token);
    if (!authData) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    const userId = authData.userId;

    let body;
    try {
        body = await req.json();
    }
    catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validatedData = joinGroupSchema.safeParse(body);

    if (!validatedData.success) {
        return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    const inviteCode = validatedData.data.inviteCode.toUpperCase();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const group = await Group.findOne({ inviteCode }).session(session);
        if (!group) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        // extra layer of security
        const user = await User.findById(userId).session(session);  
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const alreadyMember = group.members.some((member: any) => member.user.toString() === userId);
        if (alreadyMember) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({ error: "User is already a member of the group" }, { status: 400 });
        }

        group.members.push({
            user: userId,
            role: 'member'
        });
        
        await group.save({ session });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({ message: "Successfully joined the group" }, { status: 200 });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error joining group:", error);
        return NextResponse.json({ error: "Failed to join the group" }, { status: 500 });
    }
}