const express = require('express');
const batchController = require('../controllers/batchController');

const router = express.Router();

router.post('/', batchController.addBatch); // Create a new batch
router.get('/', batchController.getBatches); // Get all batches
router.get('/self', batchController.getMyBatches); // Get sel batches
router.post('/bulk', batchController.bulkUploadBatch);
router.post('/scan-to-create', batchController.scanToCreateBatch);
router.get('/:id', batchController.getBatchById); // Get a batch by ID
router.put('/:id', batchController.updateBatchById); // Update a batch by ID
router.put('/', batchController.updateBatchByName); // Update a batch by ID
router.delete('/:id', batchController.deleteBatchById); // Delete a batch by ID

module.exports = router;
