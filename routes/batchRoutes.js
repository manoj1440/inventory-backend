const express = require('express');
const batchController = require('../controllers/batchController');

const router = express.Router();

router.post('/', batchController.addBatch); // Create a new batch
router.get('/', batchController.getBatches); // Get all batches
router.get('/:id', batchController.getBatchById); // Get a batch by ID
router.put('/:id', batchController.updateBatchById); // Update a batch by ID
router.delete('/:id', batchController.deleteBatchById); // Delete a batch by ID

module.exports = router;
