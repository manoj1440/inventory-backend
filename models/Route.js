const mongoose = require('mongoose');
const { Schema } = mongoose;

const routesSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true,
        unique: true,
    },
    Customers: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
    ],
    Crates: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Crate'
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
    Dispatched: Date
}, {
    timestamps: true,
});

module.exports = mongoose.model('Route', routesSchema);
