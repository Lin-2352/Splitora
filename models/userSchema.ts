// the individualPaymentInGroup i feel is useless because we are having invidival payment in the transaction schema,
// but I am keep it for now and see if we need it later on, 
// it can be used to keep track of the total amount paid by a user in a group which can be useful for analytics 
// and also for showing the user how much they have paid in a group.

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // role: {
    //     type: String,
    //     enum: ['groupLeader', 'admin', 'member'],
    //     default: 'member'
    // },

    userName: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true,
        unique: true
    },

    // individualPaymentInGroup: [{
    //     groupId: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'Group'
    //     },
    //     totalAmount: {
    //         type: Number,
    //         default: 0
    //     }
    // }]

    resetPasswordToken: {
        type: String,
    },

    resetPasswordExpires: {
        type: Date
    }

}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);