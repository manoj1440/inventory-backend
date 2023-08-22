const Batch = require('../models/Batch');

// Create a new batch
const addBatch = async (req, res, next) => {
    try {
        const { panels, receivedAt, serialNumber, user } = req.body;

        // Validate inputs
        if (!serialNumber || !user) {
            return res.status(400).json({ message: 'Serial number and user are required' });
        }

        // Check if serial number is already registered
        const existingBatch = await Batch.findOne({ serialNumber });
        if (existingBatch) {
            return res.status(400).json({ message: 'Serial number already exists' });
        }

        const newBatch = new Batch({
            panels,
            receivedAt,
            serialNumber,
            user,
        });

        const savedBatch = await newBatch.save();
        return res.status(201).json(savedBatch);
    } catch (error) {
        return res.status(500).json({ message: 'Error adding batch', error });
    }
};

// Get all batches
const getBatches = async (req, res, next) => {
    try {
        const batches = await Batch.find().populate('panels user');
        return res.status(200).json(batches);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching batches', error });
    }
};

// Get a batch by ID
const getBatchById = async (req, res, next) => {
    try {
        const batchId = req.params.id;
        const batch = await Batch.findById(batchId).populate('panels user');
        if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        return res.status(200).json(batch);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching batch', error });
    }
};

// Update a batch by ID
const updateBatchById = async (req, res, next) => {
    try {
        const batchId = req.params.id;
        const updates = req.body;

        const updatedBatch = await Batch.findByIdAndUpdate(batchId, updates, { new: true }).populate('panels user');
        if (!updatedBatch) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        return res.status(200).json(updatedBatch);
    } catch (error) {
        return res.status(500).json({ message: 'Error updating batch', error });
    }
};

// Delete a batch by ID
const deleteBatchById = async (req, res, next) => {
    try {
        const batchId = req.params.id;
        const deletedBatch = await Batch.findByIdAndDelete(batchId);
        if (!deletedBatch) {
            return res.status(404).json({ message: 'Batch not found' });
        }
        return res.status(200).json({ message: 'Batch deleted' });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting batch', error });
    }
};

module.exports = {
    addBatch,
    getBatches,
    getBatchById,
    updateBatchById,
    deleteBatchById,
};
