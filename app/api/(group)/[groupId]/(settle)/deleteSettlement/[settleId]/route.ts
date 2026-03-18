import { NextResponse, NextRequest } from 'next/server';
import createMongoConnection from '@/middleware/mongoDB';
import { verifyToken } from '@/middleware/auth';
import settleSchema from '@/models/settleSchema';

import Group from '@/models/groupSchema';


export async function DELETE(request: NextRequest, { params }: { params: Promise<{ groupId: string, settleId: string }> }) {
    try {
        await createMongoConnection();
        const token = request.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const authData = verifyToken(token);
        if (!authData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { groupId, settleId } = await params;

        const settlement = await settleSchema.findOne({ _id: settleId, groupMongooseId: groupId });

        if (!settlement) {
            return NextResponse.json({ error: 'Settlement not found' }, { status: 404 });
        }

        const group = await Group.findOne({ _id: groupId, "members.user": authData.userId });

        if (!group) {
            return NextResponse.json(
                { error: "Group not found or unauthorized" },
                { status: 404 }
            );
        }

        const isGroupLeader = group.members.some(
            (member: any) =>
                member.user.toString() === authData.userId &&
                member.role === "groupLeader"
        );

        if (settlement.fromUser.toString() !== authData.userId && !isGroupLeader) {
            return NextResponse.json({ error: 'Forbidden: Only the user who created the settlement can delete it' }, { status: 403 });
        }

        await settleSchema.deleteOne({ _id: settleId });

        return NextResponse.json({ message: 'Settlement deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting settlement:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}