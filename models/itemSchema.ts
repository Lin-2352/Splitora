// was wondering if we should have a separate item collection or just embed it in the transaction collection,
// but I think it's better to have a separate collection for items since it can be reused in other transactions 
// and also makes it easier to query for items separately if needed.

import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    transactionMongooseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },

    name: {
        type: String,
        required: true
    },

    quantity: {
        type: Number,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    total: {
        type: Number,
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Item || mongoose.model('Item', itemSchema);