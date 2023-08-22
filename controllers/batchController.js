const Batch = require('../models/Batch');

const addBatch = async (req, res, next) => {
    try {
        const { panels, receivedAt, AssetNumber, user, quantity, PCM, DOM, WhLocation, DeliveryLocation } = req.body;

        if (!AssetNumber || !user) {
            return res.status(400).json({ status: false, data: null, message: 'Asset number and user are required' });
        }

        const existingBatch = await Batch.findOne({ AssetNumber });
        if (existingBatch) {
            return res.status(400).json({ status: false, data: null, message: 'Asset number already exists' });
        }

        const newBatch = new Batch({
            panels,
            receivedAt,
            AssetNumber,
            user,
            quantity,
            PCM,
            DOM,
            WhLocation,
            DeliveryLocation,
        });

        const savedBatch = await newBatch.save();
        return res.status(201).json({ status: true, data: savedBatch, message: 'Batch created successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error adding batch' });
    }
};

const getBatches = async (req, res, next) => {
    try {
        const batches = await Batch.find().populate('panels user');
        return res.status(200).json({ status: true, data: batches, message: 'Batches fetched successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error fetching batches' });
    }
};

const getBatchById = async (req, res, next) => {
    try {
        const batchId = req.params.id;
        const batch = await Batch.findById(batchId).populate('panels user');
        if (!batch) {
            return res.status(404).json({ status: false, data: null, message: 'Batch not found' });
        }
        return res.status(200).json({ status: true, data: batch, message: 'Batch fetched successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error fetching batch' });
    }
};

const updateBatchById = async (req, res, next) => {
    try {
        const batchId = req.params.id;
        const updates = req.body;

        const updatedBatch = await Batch.findByIdAndUpdate(batchId, updates, { new: true }).populate('panels user');
        if (!updatedBatch) {
            return res.status(404).json({ status: false, data: null, message: 'Batch not found' });
        }
        return res.status(200).json({ status: true, data: updatedBatch, message: 'Batch updated successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error updating batch' });
    }
};

const deleteBatchById = async (req, res, next) => {
    try {
        const batchId = req.params.id;
        const deletedBatch = await Batch.findByIdAndDelete(batchId);
        if (!deletedBatch) {
            return res.status(404).json({ status: false, data: null, message: 'Batch not found' });
        }
        return res.status(200).json({ status: true, data: null, message: 'Batch deleted successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error deleting batch' });
    }
};

module.exports = {
    addBatch,
    getBatches,
    getBatchById,
    updateBatchById,
    deleteBatchById,
};
