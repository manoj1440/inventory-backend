const mongoose = require('mongoose');

const panelSchema = new mongoose.Schema({
    serialNumber: {
        type: String,
        required: true,
        unique: true,
    },
    receivedAt: {
        type: Date,
        default: null,
    },
    received: {
        type: Boolean,
        default: false,
    },
    DOM: Date,
    DOE: Date,
    PCM: String,
    isActive: {
        type: Boolean,
        default: true
    },
    included: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Panel', panelSchema);
