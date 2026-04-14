import { NextResponse, NextRequest } from "next/server";
import createMongoConnection from "@/middleware/mongoDB";

import billSchema from "@/models/billSchema";


export async function POST(request: NextRequest) {
    try {
        await createMongoConnection();

        const { billId } = await request.json();

        const bill = await billSchema.findById(billId).populate('groupId', 'name');
        if (!bill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
        }

        const imageUrl = bill.imageUrl;

        const res = await fetch("http://localhost:8000/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ imageUrl })
        });

        const data = await res.json();
        
        bill.merchant = data.merchant;
        bill.items = data.items;
        bill.totalAmount = data.totalAmount;
        bill.status = "completed";

        await bill.save();

        return NextResponse.json({ message: 'Bill processed successfully', bill }, { status: 200 });
    }
    catch (error) {
        console.error('Error processing bill:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}