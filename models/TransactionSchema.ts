import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    groupMongooseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },

    // groupId: {
    //     type: String,
    //     required: true
    // },

    payer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    bill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill',
        // required: false
    },

    amount: {
        type: Number,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    category: {
        type: String,
        default: 'other'
    },

    // items: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Item'
    // }],

    splitType: {
        type: String,
        enum: ['equal', 'exact', 'percentage', 'shares'],
        default: 'equal'
    },

    splits: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amount: Number,
        percentage: Number,
        shares: Number
    }],

    // items: [{
    //     name: String,
    //     quantity: Number,
    //     price: Number,
    //     total: Number
    // }],

    status: {
        type: String,
        enum: ['processing', 'completed', 'pending', 'failed'],
        default: 'pending'
    },


}, {timestamps: true});

export default mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

// changes coming soon