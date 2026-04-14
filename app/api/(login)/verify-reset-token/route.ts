import { NextResponse, NextRequest } from 'next/server';
import User from "@/models/userSchema"; 
import createMongoConnection from "@/middleware/mongoDB";

export async function GET(req: NextRequest) {
    await createMongoConnection();
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token');

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Token is valid' }, { status: 200 });
}