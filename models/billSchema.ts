import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
    },

    rawText: {
        type: String,
    },

    merchant: {
        type: String,
    },

    totalAmount: {
        type: Number,
        default: 0
    },

    items: [{
        name: String,
        quantity: Number,
        price: Number,
        total: Number
    }],

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },

    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },

    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },

    isConverted: {
        type: Boolean,
        default: false
    }

}, {timestamps: true});

billSchema.index({ groupId: 1});

export default mongoose.models.Bill || mongoose.model('Bill', billSchema);