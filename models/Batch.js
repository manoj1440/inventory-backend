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
    serialNumber: {
        type: String,
        required: true,
        unique: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Batch', batchSchema);
