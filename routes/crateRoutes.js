const express = require('express');
const crateController = require('../controllers/crateController');

const router = express.Router();

router.post('/', crateController.addCrate); // Create a new panel
router.get('/', crateController.getCrates); // Get all panels
router.get('/route', crateController.getCratesForRoutes); // Get all panels
router.post('/bulk', crateController.bulkUploadCrates);
router.get('/by/name', crateController.getCrateByName); // Get a panel by ID
router.get('/:id', crateController.getCrateById); // Get a panel by ID
router.put('/:id', crateController.updateCrateById); // Update a panel by ID
router.put('/', crateController.updateCrateByName); // Update a panel by ID
router.delete('/:id', crateController.deleteCrateById); // Delete a panel by ID

module.exports = router;
