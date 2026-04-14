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

        // 1. Upload to ImageKit
        const uploadResponse = await imagekit.upload({
            file: buffer,
            fileName: `bill_${Date.now()}_${file.name}.jpg`,
            folder: `group_bills/${groupId}/`
        });

        // 2. OCR Scanning (using the Python microservice)
        let ocrData = null;
        try {
            const OCR_API_URL = process.env.RECEIPT_SCANNER_URL || "https://receipt-backend-qm3v.onrender.com";
            const ocrFormData = new FormData();
            ocrFormData.append("paid_by_user_id", authData.userId);
            // Re-create Blob from buffer for the scan-receipt endpoint
            const fileBlob = new Blob([buffer], { type: file.type });
            ocrFormData.append("receipt_image", fileBlob, file.name || "receipt.jpg");

            const ocrRes = await fetch(`${OCR_API_URL}/api/scan-receipt`, {
                method: 'POST',
                body: ocrFormData,
            });

            if (ocrRes.ok) {
                ocrData = await ocrRes.json();
            } else {
                console.warn("OCR Service returned an error:", await ocrRes.text());
            }
        } catch (ocrErr) {
            console.error("Failed to call OCR service:", ocrErr);
            // We don't throw here, as the primary goal of this API is still uploading the bill to ImageKit
        }

        // 3. Save to Database
        const newBill = new BillSchema({
            groupId: groupId,
            imageUrl: uploadResponse.url,
            uploadedBy: authData.userId,
            merchant: ocrData?.vendor || "",
            totalAmount: ocrData?.total || 0,
            items: ocrData?.items?.map((it: any) => ({
                name: it.name,
                price: it.price,
                quantity: 1, // OCR might not always give quantity, default to 1
                total: it.price
            })) || [],
            rawText: ocrData?.raw_text || "",
            status: ocrData ? 'completed' : 'processing'
        });
        await newBill.save();

        return NextResponse.json({
            message: 'Bill uploaded and scanned successfully',
            bill: {
                id: newBill._id,
                imageUrl: newBill.imageUrl,
                totalAmount: newBill.totalAmount,
                status: newBill.status
            },
            ocr: ocrData // Return OCR result to the frontend for auto-filling
            }, { status: 201 }
        )
    }
    catch (error) {
        console.error('Error uploading bill:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}