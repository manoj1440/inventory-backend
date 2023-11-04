const expressAsyncHandler = require('express-async-handler');
const Batch = require('../models/Batch');
const Panel = require('../models/Panel');
const { createNewBatch } = require('../utils/bulkUpload');

const addBatch = async (req, res, next) => {
    try {
        const { panels, receivedAt, AssetNumber, user, PCM, DOM, WhLocation, DeliveryLocation } = req.body;

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
            PCM,
            DOM,
            WhLocation,
            DeliveryLocation,
        });

        const savedBatch = await newBatch.save();
        if (savedBatch) {
            await Panel.updateMany(
                { _id: { $in: panels } },
                { $set: { included: true, received: null, receivedAt: null } }
            );
        }

        return res.status(201).json({ status: true, data: savedBatch, message: 'Batch created successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error adding batch' });
    }
};

const scanToCreateBatch = expressAsyncHandler(async (req, res) => {
    try {
        const { AssetNumber, panels } = req.body;

        if (!AssetNumber || !panels || !Array.isArray(panels) || panels.length === 0) {
            return res.status(400).json({
                status: false,
                data: null,
                message: 'Asset number and a non-empty array of panels are required',
            });
        }

        const existingBatch = await Batch.findOne({ AssetNumber });
        if (existingBatch) {
            return res.status(400).json({
                status: false,
                data: null,
                message: 'Asset number already exists',
            });
        }
        const uniquePanels = Array.from(new Set(panels));

        const panelObjects = await Panel.find({ serialNumber: { $in: uniquePanels } });
        const activePanelObjects = panelObjects.filter(item => item.isActive);

        const panelIds = panelObjects.map((panel) => panel._id);
        const activePanelIds = activePanelObjects.map((panel) => panel._id);

        const panelsToPush = [...activePanelIds];

        if (panelIds.length !== uniquePanels.length) {
            const missingPanels = uniquePanels.filter((serialNumber) =>
                !panelIds.includes(panelObjects.find((panel) => panel.serialNumber === serialNumber)._id)
            );

            const newPanels = await Panel.insertMany(
                missingPanels.map((serialNumber) => ({ serialNumber, included: true }))
            );

            panelsToPush.push(...newPanels.map((panel) => panel._id));
        }

        const newBatch = new Batch({
            panels: panelIds,
            AssetNumber,
        });

        const savedBatch = await newBatch.save();
        if (savedBatch) {
            await Panel.updateMany(
                { _id: { $in: panelIds } },
                { $set: { received: null, receivedAt: null, included: true } }
            );
        }

        return res.status(201).json({
            status: true,
            data: savedBatch,
            message: 'Batch created successfully',
        });
    } catch (error) {
        console.error('Error creating batch:', error);
        return res.status(500).json({
            status: false,
            data: null,
            message: 'Error creating batch',
        });
    }
});

const bulkUploadBatch = expressAsyncHandler(async (req, res) => {
    const { batches } = req.body;
    const addedBatches = [];

    for (const batch of batches) {
        try {
            const existingBatch = await Batch.findOne({ AssetNumber: batch.AssetNumber });

            if (!existingBatch) {
                const newBatch = await createNewBatch(batch);
                addedBatches.push(newBatch);
            }
        } catch (error) {
            console.error('Error adding Batch:', error);
        }
    }

    return res.status(201).json({
        status: true,
        addedBatches,
        message: 'Bulk upload completed with skipped Batches',
    });
});

const getBatches = async (req, res, next) => {
    try {
        const batches = await Batch.find().populate({
            path: 'panels user dispatchedBy',
            select: '-password',
        });
        return res.status(200).json({ status: true, data: batches, message: 'Batches fetched successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error fetching batches' });
    }
};

const getMyBatches = async (req, res, next) => {
    try {
        const userId = req.userData.user._id;
        const batches = await Batch.find({ dispatchedBy: userId }).populate({
            path: 'panels user dispatchedBy',
            select: '-password',
        });
        return res.status(200).json({ status: true, data: batches, message: 'Batches fetched successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error fetching batches' });
    }
};

const getBatchById = async (req, res, next) => {
    try {
        const batchId = req.params.id;
        const batch = await Batch.findById(batchId).populate({
            path: 'panels user dispatchedBy',
            select: '-password',
        });
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
        updates['dispatchedBy'] = req.userData.user._id;

        const updatedBatch = await Batch.findByIdAndUpdate(batchId, updates, { new: true }).populate('panels user');
        if (!updatedBatch) {
            return res.status(404).json({ status: false, data: null, message: 'Batch not found' });
        }
        if (updatedBatch && updates.panels && updates.panels.length > 0) {
            await Panel.updateMany(
                { _id: { $in: updates.panels } },
                { $set: { included: true } }
            );
        }
        if (updatedBatch && updates.diffPanels && updates.diffPanels.length > 0) {
            await Panel.updateMany(
                { _id: { $in: updates.diffPanels } },
                { $set: { included: false } }
            );
        }
        return res.status(200).json({ status: true, data: updatedBatch, message: 'Batch updated successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error updating batch' });
    }
};

const updateBatchByName = async (req, res, next) => {
    try {
        const { AssetNumber } = req.body;

        if (!AssetNumber || (Array.isArray(AssetNumber) && AssetNumber.length === 0)) {
            return res.status(404).json({ status: false, data: null, message: 'AssetNumber can not be blank' });
        }

        const updates = req.body;
        updates['dispatchedBy'] = req.userData.user._id;
        delete updates['AssetNumber'];
        const AssetNumberArray = Array.isArray(AssetNumber)
            && AssetNumber.length > 0 ? AssetNumber : [AssetNumber]
        const updatedBatches = await Batch.updateMany(
            { AssetNumber: { $in: AssetNumberArray } },
            updates,
            { new: true }
        ).populate('panels user');
        if (updatedBatches.matchedCount === 0) {
            return res.status(404).json({ status: false, data: null, message: 'Batches not found' });
        }

        return res.status(200).json({ status: true, data: updatedBatches, message: 'Batch updated successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error updating batch' + error });
    }
};

const deleteBatchById = async (req, res, next) => {
    try {
        const batchId = req.params.id;
        const batch = await Batch.findById(batchId);

        if (!batch) {
            return res.status(404).json({ status: false, data: null, message: 'Batch not found' });
        }

        const deletedBatch = await Batch.findByIdAndDelete(batchId);

        if (!deletedBatch) {
            return res.status(404).json({ status: false, data: null, message: 'Batch not found' });
        }

        await Panel.updateMany(
            { _id: { $in: batch.panels } },
            { $set: { included: false, received: null, receivedAt: null } }
        );

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
    bulkUploadBatch,
    scanToCreateBatch,
    updateBatchByName,
    getMyBatches
};
