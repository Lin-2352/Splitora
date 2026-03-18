import { NextRequest, NextResponse } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";
import BillSchema from "@/models/billSchema"

import { verifyToken } from "@/middleware/auth";
import imagekit from "@/middleware/imagekit"

export async function POST(req: NextRequest, context: { params: Promise<{groupId: string}> }) {
    try {
        await createMongoConnection();
        const token = req.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const authData = verifyToken(token);
        if (!authData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { groupId } = await context.params;

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Bill image is required' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadResponse = await imagekit.upload({
            file: buffer,
            fileName: `bill_${Date.now()}_${file.name}.jpg`,
            folder: `group_bills/${groupId}/`
        });

        const newBill = new BillSchema({
            groupId: groupId,
            imageUrl: uploadResponse.url,
            uploadedBy: authData.userId,
            totalAmount: 0, // This can be updated later when the bill is processed
            status: 'processing'
        })
        await newBill.save();

        return NextResponse.json({
            message: 'Bill uploaded successfully',
            bill: {
                id: newBill._id,
                imageUrl: newBill.imageUrl,
                totalAmount: newBill.totalAmount,
                status: newBill.status
            }
            }, { status: 201 }
        )
    }
    catch (error) {
        console.error('Error uploading bill:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}