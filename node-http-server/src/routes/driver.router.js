const express = require('express');
const router = express.Router();
const {
    getAssignedBookings,
    updateDeliveryStatus,
    uploadProofOfDelivery,
    reportFailedDelivery,
    getDeliveryHistory
} = require('../driver/driver.controller');

const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require driver authentication
router.use(protect);
router.use(authorize('driver'));

router.get('/bookings', getAssignedBookings);
router.patch('/bookings/:id/status', updateDeliveryStatus);
router.post('/bookings/:id/proof', uploadProofOfDelivery);
router.post('/bookings/:id/failed', reportFailedDelivery);
router.get('/history', getDeliveryHistory);

module.exports = router;
