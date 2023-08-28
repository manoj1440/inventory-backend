const User = require('../models/User');
const hashPassword = require('../utils/hash-password');
const validator = require('validator');

const createNewUser = async (userData) => {
    const { name, email, password, contact, role, location } = userData;

    if (!name || !email || !contact) {
        throw new Error('All fields are required');
    }
    if (!validator.isEmail(email)) {
        throw new Error('Invalid email format');
    }

    const hashedPassword = hashPassword(`${password}` || '12345678');

    let locationArr = [];

    try {
        locationArr = JSON.parse(location);
    } catch (error) {

    }

    if (locationArr && locationArr.length === 0) {
        locationArr = [`${location}`]
    }

    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        location: locationArr,
        contact,
        role,
    });

    return await newUser.save();
};

module.exports = {
    createNewUser,
};
