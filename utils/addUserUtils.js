const User = require('../models/User');
const hashPassword = require('../utils/hash-password');
const validator = require('validator');

const createNewUser = async (userData) => {
    const { name, email, password, contact, role, location } = userData;

    // Validation logic
    if (!name || !email || !contact) {
        throw new Error('All fields are required');
    }
    if (!validator.isEmail(email)) {
        throw new Error('Invalid email format');
    }
    // Additional validation logic...

    const hashedPassword = hashPassword(password || '12345678');

    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        location,
        contact,
        role,
    });

    return await newUser.save();
};

module.exports = {
    createNewUser,
};
