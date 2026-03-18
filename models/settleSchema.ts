import mongoose from "mongoose";

const settleSchema = new mongoose.Schema({
    groupMongooseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },

    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    toUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    amount: {
        type: Number,
        min: 0.01,
        required: true
    },

    settleAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Settle || mongoose.model('Settle', settleSchema);