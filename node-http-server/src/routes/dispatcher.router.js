const express = require('express');
const router = express.Router();
const {
    getPendingShipments,
    getAvailableDrivers,
    assignShipmentToDriver,
    reassignShipment,
    getActiveShipments,
    getDispatchDashboard
} = require('../dispatcher/dispatcher.controller');

const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('dispatcher', 'admin'));

router.get('/shipments/pending', getPendingShipments);
router.get('/shipments/active', getActiveShipments);
router.get('/drivers/available', getAvailableDrivers);
router.post('/shipments/:id/assign', assignShipmentToDriver);
router.patch('/shipments/:id/reassign', reassignShipment);
router.get('/dashboard', getDispatchDashboard);

module.exports = router;
