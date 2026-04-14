import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";
import mongoose from "mongoose";

import Group from "@/models/groupSchema";
import User from "@/models/userSchema";
import { verifyToken } from "@/middleware/auth";

import crypto from 'node:crypto';

const groupSchema = z.object({
    groupName: z.string().trim().min(2).max(20),
    
})

function generateInviteCode() {
    return crypto.randomBytes(4)
    .toString('hex')
    .toUpperCase()
}


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

    const validatedData = groupSchema.safeParse(body);

    if (!validatedData.success) {
        return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    const { groupName } = validatedData.data;
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const leader = await User.findById(userId).session(session);
        if (!leader) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({ error: "Group leader not found" }, { status: 404 });
        }
        
        let inviteCode = generateInviteCode();

        const newGroup = await Group.create([{
            groupName,
            inviteCode,
            members: [{
                user: leader._id,
                role: 'groupLeader'
            }]
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({ message: "Group created successfully", group: newGroup[0] }, { status: 201 });
    }
    catch (error: any) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        session.endSession();

        if (error.code === 11000 && error.keyPattern && error.keyPattern.inviteCode) {
            return NextResponse.json({ error: "Failed to generate a unique invite code, please try again" }, { status: 500 });
        }

        console.error("Error creating group:", error);

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}