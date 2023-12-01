const express = require('express');
const routesController = require('../controllers/routesController');

const router = express.Router();

router.post('/', routesController.addRoute); // Create a new batch
router.post('/add-new-delivery', routesController.addNewDelivery); // Create a new batch
router.get('/', routesController.getRoutes); // Get all batches
router.get('/old', routesController.getOldRoutes); // Get all batches
router.get('/self', routesController.getMyRoutes); // Get sel batches
// router.post('/bulk', routesController.bulkUploadRoutes); //will do later
router.post('/scan-to-create', routesController.scanToCreateRoute);
router.post('/dispatch/route', routesController.dispatchRouteByName);
router.get('/:id', routesController.getRouteById); // Get a batch by ID
router.put('/:id', routesController.updateRouteById); // Update a batch by ID
router.put('/', routesController.updateRouteByName); // Update a batch by ID
router.delete('/:id', routesController.deleteRouteById); // Delete a batch by ID

module.exports = router;
