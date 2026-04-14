import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import UserSchema from "@/models/userSchema";
import createMongoConnection from "@/middleware/mongoDB";

export async function POST(req: NextRequest) {
    await createMongoConnection();
    const { token, password } = await req.json()

    const user = await UserSchema.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        return NextResponse.json({ error: "Invalid or expire token" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return Response.json({
        message: "Password reset successful"
    });
}