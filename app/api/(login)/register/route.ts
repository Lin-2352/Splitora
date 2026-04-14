import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { NextRequest, NextResponse } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";
import User from "@/models/userSchema";

const registerSchema = z.object({
    userName: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    phone: z.string().min(10).max(15)
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
});

export async function POST(req: NextRequest) {
    await createMongoConnection();
    console.log("MONGODB_URI type:", typeof process.env.MONGODB_URI);
    console.log("MONGODB_URI boolean:", !!process.env.MONGODB_URI);
    const body = await req.json();
    const validatedData = registerSchema.safeParse(body); 

    if (!validatedData.success) {
        return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    const { userName, email, password, phone } = validatedData.data;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ userName, email, password: hashedPassword, phone });
        await newUser.save();

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            return NextResponse.json({ error: "JWT secret is not defined" }, { status: 500 });
        }   

        const token = jwt.sign({
            userId: newUser._id,
            userName: newUser.userName,
            email: newUser.email,
        }, secret, { expiresIn: '1h' });

        return NextResponse.json({ message: "Registration successful", 
            token, 
            user: {
                userId: newUser._id,
                userName: newUser.userName,
                email: newUser.email,
            } },

            { status: 201 }
        );

    } catch (error) {
        console.error("Error during registration:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }   
}   