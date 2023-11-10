const mongoose = require('mongoose');
const { Schema } = mongoose;

const oldRoutesSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true,
        unique: true,
    },
    DeliverdItems: [],
}, {
    timestamps: true,
});

module.exports = mongoose.model('OldRoute', oldRoutesSchema);
