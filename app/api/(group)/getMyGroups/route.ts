import groupSchema from "@/models/groupSchema";
import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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
        const groups = await groupSchema.find({ "members.user": userId }).select('groupName inviteCode members');

        return NextResponse.json({ groups }, { status: 200 });
    }

    catch (error) {
        console.error("Error fetching groups:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}