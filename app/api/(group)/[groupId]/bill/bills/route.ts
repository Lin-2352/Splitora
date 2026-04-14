import { NextRequest, NextResponse } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";
import billSchema from "@/models/billSchema";

export async function GET(request: NextRequest, context: { params: Promise<{ groupId: string }> }) {
    try {
        await createMongoConnection();

        const { groupId } = await context.params;

        const bills = await billSchema.find({ groupMongooseId: groupId })
        .populate("uploadedBy", "name email")
        .sort({ createdAt: -1 });

        return NextResponse.json({ bills }, { status: 200 });
    } catch (error) {
        console.error('Error fetching bills:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}