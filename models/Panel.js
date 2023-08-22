const mongoose = require('mongoose');

const panelSchema = new mongoose.Schema({
    serialNumber: {
        type: String,
        required: true,
        unique: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Panel', panelSchema);
