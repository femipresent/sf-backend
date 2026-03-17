const express = require('express'); 
const router = express.Router();
const {
    getAllDrivers,
    updateDriverStatus,
    getAllUsers,
    getAdminDashboard,
    getDeliveryReports,
    getDriverPerformance,
    getRevenueReports
} = require('../admin/admin.controller');

const {
    createRate,
    getAllRates,
    updateRate
} = require('../admin/pricing.controller');

const {
    generateInvoice,
    getInvoice,
    markInvoicePaid,
    getAllInvoices
} = require('../admin/invoice.controller');

const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/drivers', getAllDrivers);
router.patch('/drivers/:id/status', updateDriverStatus);
router.get('/users', getAllUsers);
router.get('/dashboard', getAdminDashboard);
router.get('/reports/deliveries', getDeliveryReports);
router.get('/reports/driver-performance', getDriverPerformance);
router.get('/reports/revenue', getRevenueReports);

// Rate management
router.post('/rates', createRate);
router.get('/rates', getAllRates);
router.put('/rates/:id', updateRate);

// Invoice management
router.post('/invoices/generate/:bookingId', generateInvoice);
router.get('/invoices', getAllInvoices);
router.get('/invoices/:id', getInvoice);
router.patch('/invoices/:id/pay', markInvoicePaid);

module.exports = router;
