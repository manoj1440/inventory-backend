const Batch = require("../models/Batch");
const User = require('../models/User');
const hashPassword = require('../utils/hash-password');
const validator = require('validator');
const Panel = require("../models/Panel");

const createNewBatch = async (batchData) => {
    const { panels, receivedAt, received, AssetNumber, user, PCM, DOM, Dispatched, WhLocation, DeliveryLocation } = batchData;

    if (!AssetNumber) {
        throw new Error('Asset number is required');
    }

    const newBatchData = new Batch({
        panels,
        receivedAt: receivedAt || null,
        received: received !== undefined ? received : false,
        AssetNumber,
        user,
        PCM,
        DOM: DOM || null,
        Dispatched: Dispatched || null,
        WhLocation,
        DeliveryLocation,
    });

    return await newBatchData.save();
};

const createNewPanel = async (panelData) => {
    const { serialNumber, receivedAt, received, DOM, DOE, included } = panelData;

    if (!serialNumber) {
        throw new Error('Serial number is required');
    }

    const newPanelData = new Panel({
        serialNumber,
        receivedAt: receivedAt || null,
        received: received !== undefined ? received : false,
        DOM: DOM || null,
        DOE: DOE || null,
        included: included !== undefined ? included : false,
    });

    return await newPanelData.save();
};

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
    createNewBatch,
    createNewPanel,
    createNewUser
};
