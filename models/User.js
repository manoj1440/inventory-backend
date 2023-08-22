const mongoose = require('mongoose');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    contact: {
        type: Number,
        required: true
    },
    location: {
        type: [],
        required: true
    },
    role: {
        type: String,
        default: 'admin'
    }
}, {
    timestamps: true
});

userSchema.methods.validatePassword = function (password) {
    return this.password === crypto.createHmac('sha256', process.env.PASSWORD_HASH_STRING).update(password).digest('hex');
};

module.exports = mongoose.model('User', userSchema);