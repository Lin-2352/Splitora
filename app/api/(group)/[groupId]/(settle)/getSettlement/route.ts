import { NextResponse, NextRequest } from 'next/server';

import createMongoConnection from '@/middleware/mongoDB';
import { verifyToken } from '@/middleware/auth';

import settleSchema from '@/models/settleSchema';
import Group from '@/models/groupSchema';

export async function GET(request: NextRequest, context: { params: Promise<{ groupId: string }> }) {
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

        const { groupId } = await context.params;
        
        const group = await Group.findOne({
            _id: groupId,
            "members.user": authData.userId
        });

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        const settlements = await settleSchema.find({ groupMongooseId: groupId })
            .populate('fromUser', 'name email')
            .populate('toUser', 'name email')
            .sort({ settleAt: -1 });

        return NextResponse.json({ settlements }, { status: 200 });

    } catch (error) {
        console.error('Error fetching settlements:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
