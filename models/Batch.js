const mongoose = require('mongoose');
const { Schema } = mongoose;

const batchSchema = new Schema({
    panels: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Panel',
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    receivedAt: {
        type: Date,
        default: null,
    },
    AssetNumber: {
        type: String,
        required: true,
        unique: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    PCM: String,
    DOM: Date,
    WhLocation: String,
    DeliveryLocation: String,
}, {
    timestamps: true,
});

module.exports = mongoose.model('Batch', batchSchema);
