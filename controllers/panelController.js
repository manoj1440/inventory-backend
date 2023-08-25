const Panel = require('../models/Panel');
const Batch = require('../models/Batch');

const addPanel = async (req, res, next) => {
    try {
        const { serialNumber } = req.body;

        if (!serialNumber) {
            return res.status(400).json({ status: false, data: null, message: 'Serial number is required' });
        }

        const existingPanel = await Panel.findOne({ serialNumber });
        if (existingPanel) {
            return res.status(400).json({ status: false, data: null, message: 'Serial number already exists' });
        }

        const newPanel = new Panel({
            serialNumber,
        });

        const savedPanel = await newPanel.save();
        return res.status(201).json({ status: true, data: savedPanel, message: 'Panel created successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error adding panel' });
    }
};

const getPanels = async (req, res, next) => {
    try {
        const panels = await Panel.find();
        return res.status(200).json({ status: true, data: panels, message: 'Panels fetched successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error fetching panels' });
    }
};

const getPanelsForBatch = async (req, res, next) => {
    try {
        const panels = await Panel.find({ included: false });
        return res.status(200).json({ status: true, data: panels, message: 'Panels fetched successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error fetching panels' });
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
        return res.status(500).json({ status: false, data: null, message: 'Error fetching panel' });
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
        return res.status(200).json({ status: true, data: updatedPanel, message: 'Panel updated successfully' });
    } catch (error) {
        return res.status(500).json({ status: false, data: null, message: 'Error updating panel' });
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
        return res.status(500).json({ status: false, data: null, message: 'Error deleting panel' });
    }
};

module.exports = {
    addPanel,
    getPanels,
    getPanelById,
    updatePanelById,
    deletePanelById,
    getPanelsForBatch
};
