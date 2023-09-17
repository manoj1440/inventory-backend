const mongoose = require('mongoose');
const { Schema } = mongoose;

const batchSchema = new Schema({
    AssetNumber: {
        type: String,
        required: true,
        unique: true,
    },
    panels: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Panel'
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    dispatchedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    receivedAt: {
        type: Date,
        default: null,
    },
    received: {
        type: Boolean,
        default: false,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    PCM: String,
    DOM: Date,
    Dispatched: Date,
    WhLocation: String,
    DeliveryLocation: String,
}, {
    timestamps: true,
});

module.exports = mongoose.model('Batch', batchSchema);
