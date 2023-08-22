const Panel = require('../models/Panel');

// Create a new panel
const addPanel = async (req, res, next) => {
    try {
        const { serialNumber } = req.body;

        // Validate inputs
        if (!serialNumber) {
            return res.status(400).json({ message: 'Serial number is required' });
        }

        // Check if serial number is already registered
        const existingPanel = await Panel.findOne({ serialNumber });
        if (existingPanel) {
            return res.status(400).json({ message: 'Serial number already exists' });
        }

        const newPanel = new Panel({
            serialNumber,
        });

        const savedPanel = await newPanel.save();
        return res.status(201).json(savedPanel);
    } catch (error) {
        return res.status(500).json({ message: 'Error adding panel', error });
    }
};

// Get all panels
const getPanels = async (req, res, next) => {
    try {
        const panels = await Panel.find();
        return res.status(200).json(panels);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching panels', error });
    }
};

// Get a panel by ID
const getPanelById = async (req, res, next) => {
    try {
        const panelId = req.params.id;
        const panel = await Panel.findById(panelId);
        if (!panel) {
            return res.status(404).json({ message: 'Panel not found' });
        }
        return res.status(200).json(panel);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching panel', error });
    }
};

// Update a panel by ID
const updatePanelById = async (req, res, next) => {
    try {
        const panelId = req.params.id;
        const updates = req.body;

        const updatedPanel = await Panel.findByIdAndUpdate(panelId, updates, { new: true });
        if (!updatedPanel) {
            return res.status(404).json({ message: 'Panel not found' });
        }
        return res.status(200).json(updatedPanel);
    } catch (error) {
        return res.status(500).json({ message: 'Error updating panel', error });
    }
};

// Delete a panel by ID
const deletePanelById = async (req, res, next) => {
    try {
        const panelId = req.params.id;
        const deletedPanel = await Panel.findByIdAndDelete(panelId);
        if (!deletedPanel) {
            return res.status(404).json({ message: 'Panel not found' });
        }
        return res.status(200).json({ message: 'Panel deleted' });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting panel', error });
    }
};

module.exports = {
    addPanel,
    getPanels,
    getPanelById,
    updatePanelById,
    deletePanelById
};
