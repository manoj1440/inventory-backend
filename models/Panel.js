const mongoose = require('mongoose');

const panelSchema = new mongoose.Schema({
    serialNumber: {
        type: String,
        required: true,
        unique: true,
    },
    DOM: Date,
    DOE: Date,
    included: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Panel', panelSchema);
