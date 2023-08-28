const Batch = require("../models/Batch");

const createNewBatch = async (batchData) => {
    const { panels, receivedAt, received, AssetNumber, user, PCM, DOM, Dispatched, WhLocation, DeliveryLocation } = batchData;

    if (!AssetNumber ) {
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
module.exports = {
    createNewBatch,
};
