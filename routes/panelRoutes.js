const express = require('express');
const panelController = require('../controllers/panelController');

const router = express.Router();

router.post('/', panelController.addPanel); // Create a new panel
router.get('/', panelController.getPanels); // Get all panels
router.get('/batch', panelController.getPanelsForBatch); // Get all panels
router.post('/bulk', panelController.bulkUploadPanels);
router.get('/:id', panelController.getPanelById); // Get a panel by ID
router.put('/:id', panelController.updatePanelById); // Update a panel by ID
router.delete('/:id', panelController.deletePanelById); // Delete a panel by ID

module.exports = router;
