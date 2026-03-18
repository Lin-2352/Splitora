// i am storing the role in member so i think there is no need to store the group leader
// separately in the group schema, we can just check the role of the member to find out 
// who is the group leader, this will also make it easier to change the group leader in 
// future if needed.

import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true,
        unique: true
    },

    // groupLeader: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User',
    //     required: true
    // },

    inviteCode: {
        type: String,
        required: true,
        unique: true
    },

    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        role: {
            type: String,
            enum: ['groupLeader', 'member'],
            default: 'member'
        }

    }],
}, { timestamps: true })

export default mongoose.models.Group || mongoose.model('Group', groupSchema);