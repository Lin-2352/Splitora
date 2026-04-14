import { z } from "zod";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { NextRequest, NextResponse } from "next/server";

import createMongoConnection from "@/middleware/mongoDB";
import User from "@/models/userSchema";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
});

export async function POST(req: NextRequest) {
    await createMongoConnection();

    const body = await req.json();
    const validatedData = loginSchema.safeParse(body);

    if (!validatedData.success) {
        return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    const { email, password } = validatedData.data;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        const secret = process.env.JWT_SECRET

        if (!secret) {
            return NextResponse.json({ error: "JWT secret is not defined" }, { status: 500 });
        }

        const token = jwt.sign({
            userId: user._id,
            userName: user.userName,
            email: user.email,
        }, secret, { expiresIn: '1h'
        });

        return NextResponse.json({ message: "Login successful", 
            token, 
            user: {
                userId: user._id,
                userName: user.userName,
                email: user.email,
            }

        }, { status: 200 });
        
    } catch (error) {
        console.error("Error during login:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
