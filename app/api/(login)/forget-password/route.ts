import { NextResponse, NextRequest } from 'next/server';
import crypto from 'node:crypto';
import User from "@/models/userSchema";
import createMongoConnection from "@/middleware/mongoDB";
import transporter from "@/middleware/sendmailer";

export async function POST(request: NextRequest) {
    try {
        await createMongoConnection();
        const { email } = await request.json();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 10);
        
        await user.save();

        const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;

        console.log(`Password reset link: ${resetUrl}`);

        await transporter.sendMail({
            from: process.env.EMAIL,
            to: user.email,
            subject: "Password Reset",
            html: `<a href="${resetUrl}">Reset Password</a>`
        });

        return NextResponse.json({ message: 'Password reset link has been sent to your email' }, { status: 200 });
    }
    catch (error) {
        console.error('Error in forget password:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
