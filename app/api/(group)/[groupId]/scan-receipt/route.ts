import { NextRequest, NextResponse } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";
import { verifyToken } from "@/middleware/auth";
import Group from "@/models/groupSchema";
import "@/models/userSchema";

export const maxDuration = 60; // Render cold starts and OCR processing might take a while

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    await createMongoConnection();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authData = verifyToken(token);
    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const group = await Group.findOne({
      _id: groupId,
      "members.user": authData.userId
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found or unauthorized" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("receipt_image") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Prepare exactly what the Python backend expects
    const backendFormData = new FormData();
    backendFormData.append("paid_by_user_id", authData.userId);
    backendFormData.append("receipt_image", file, file.name);

    const OCR_API_URL = process.env.RECEIPT_SCANNER_URL || "https://receipt-backend-qm3v.onrender.com";

    // Call the external standalone Render service
    const response = await fetch(`${OCR_API_URL}/api/scan-receipt`, {
      method: 'POST',
      body: backendFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OCR Service Error:", data);
      return NextResponse.json(
        { error: data.error || "OCR service failed to process the receipt." },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error("Receipt proxy error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error during receipt scan." },
      { status: 500 }
    );
  }
}
