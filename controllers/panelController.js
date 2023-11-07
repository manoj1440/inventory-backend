const Panel = require('../models/Panel');
const Batch = require('../models/Batch');
const expressAsyncHandler = require('express-async-handler');
const { createNewPanel } = require('../utils/bulkUpload');

const addPanel = async (req, res, next) => {
    try {
        const { serialNumber,
            DOE,
            DOM, PCM } = req.body;

        if (!serialNumber) {
            return res.status(400).json({ status: false, data: null, message: 'Serial number is required' });
        }

        const existingPanel = await Panel.findOne({ serialNumber });
        if (existingPanel) {
            return res.status(400).json({ status: false, data: null, message: 'Serial number already exists' });
        }

        const newPanel = new Panel({
            serialNumber,
            DOE: DOE || null,
            DOM: DOM || null,
            PCM: PCM || null
        });

        const savedPanel = await newPanel.save();
        return res.status(201).json({ status: true, data: savedPanel, message: 'Panel created successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error adding panel', error: error });
    }
};

const bulkUploadPanels = expressAsyncHandler(async (req, res) => {
    const { panels } = req.body;

    if (!panels || panels.length === 0) {
        return res.status(400).json({
            status: false,
            message: 'No panels provided for bulk upload.',
        });
    }

    try {
        const serialNumbers = panels.map(panel => panel.serialNumber);
        const existingPanels = await Panel.find({ serialNumber: { $in: serialNumbers } });

        // Create a map of existing panels for quick look-up
        const existingPanelMap = {};
        existingPanels.forEach(existingPanel => {
            existingPanelMap[existingPanel.serialNumber] = existingPanel;
        });

        const newPanels = [];
        const skippedPanels = [];

        for (const panel of panels) {
            if (!existingPanelMap[panel.serialNumber]) {
                newPanels.push(panel);
            } else {
                skippedPanels.push(panel);
            }
        }

        // Insert new panels in bulk
        if (newPanels.length > 0) {
            await Panel.insertMany(newPanels);
        }

        return res.status(201).json({
            status: true,
            addedPanels: newPanels,
            skippedPanels,
            message: 'Bulk upload completed with skipped panels.',
        });
    } catch (error) {
        console.error('Error adding panels:', error);
        return res.status(200).json({
            status: false,
            message: 'Internal Server Error', error: error
        });
    }
});

const getPanels = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        const nameFilter = req.query.search && req.query.search.trim().length > 0 ? { serialNumber: { $regex: new RegExp(req.query.search, 'i') } } : {};

        const totalPanels = await Panel.countDocuments(nameFilter);

        let panels;
        if (req.query.page && req.query.page.trim().length > 0) {
            panels = await Panel.find(nameFilter)
                .skip((page - 1) * pageSize)
                .limit(pageSize);
        } else {
            panels = await Panel.find(nameFilter)
        }

        const panelsWithAssetNumber = await Promise.all(panels.map(async (panel) => {
            const batch = await Batch.findOne({ panels: panel._id }).select('AssetNumber');
            return {
                ...panel.toObject(),
                AssetNumber: batch ? batch.AssetNumber : null,
            };
        }));

        return res.status(200).json({
            status: true,
            data: panelsWithAssetNumber,
            message: 'Panels fetched successfully',
            total: totalPanels,
        });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error fetching panels' + error });
    }
};

const getPanelsForBatch = async (req, res, next) => {
    try {
        const panels = await Panel.find({ included: false });
        const panel2 = await Panel.find({ included: true, received: true });
        const panelsData = [...panels, ...panel2].filter(item => item.isActive);
        return res.status(200).json({ status: true, data: panelsData, message: 'Panels fetched successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error fetching panels' });
    }
};

const getPanelById = async (req, res, next) => {
    try {
        const panelId = req.params.id;
        const panel = await Panel.findById(panelId);
        if (!panel) {
            return res.status(404).json({ status: false, data: null, message: 'Panel not found' });
        }
        return res.status(200).json({ status: true, data: panel, message: 'Panel fetched successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error fetching panel' });
    }
};

const updatePanelById = async (req, res, next) => {
    try {
        const panelId = req.params.id;
        const updates = req.body;

        const updatedPanel = await Panel.findByIdAndUpdate(panelId, updates, { new: true });
        if (!updatedPanel) {
            return res.status(404).json({ status: false, data: null, message: 'Panel not found' });
        }
        if (updates.included === false) {
            await Batch.updateMany(
                { panels: panelId },
                { $pull: { panels: panelId } }
            );
        }
        return res.status(200).json({ status: true, data: updatedPanel, message: 'Panel updated successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error updating panel' });
    }
};

const updatePanelByName = async (req, res, next) => {
    try {
        const { serialNumber } = req.body;

        if (!serialNumber) {
            return res.status(404).json({ status: false, data: null, message: 'serialNumber can not blank' });
        }

        const updates = req.body;

        const updatedPanel = await Panel.findOneAndUpdate({ serialNumber }, updates, { new: true });
        if (!updatedPanel) {
            return res.status(404).json({ status: false, data: null, message: 'Panel not found' });
        }
        if (updates.included === false) {
            await Batch.updateMany(
                { panels: updatedPanel._id },
                { $pull: { panels: updatedPanel._id } }
            );
        }
        return res.status(200).json({ status: true, data: updatedPanel, message: 'Panel updated successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error updating panel' });
    }
};

const deletePanelById = async (req, res, next) => {
    try {
        const panelId = req.params.id;
        const deletedPanel = await Panel.findByIdAndDelete(panelId);
        if (!deletedPanel) {
            return res.status(404).json({ status: false, data: null, message: 'Panel not found' });
        }
        await Batch.updateMany(
            { panels: panelId },
            { $pull: { panels: panelId } }
        );
        return res.status(200).json({ status: true, data: null, message: 'Panel deleted successfully' });
    } catch (error) {
        return res.status(200).json({ status: false, error: error, data: null, message: 'Error deleting panel' });
    }
};

module.exports = {
    addPanel,
    getPanels,
    getPanelById,
    updatePanelById,
    deletePanelById,
    getPanelsForBatch,
    bulkUploadPanels,
    updatePanelByName
};
