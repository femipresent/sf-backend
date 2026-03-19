const express = require('express');
const router = express.Router();
const {
    initializePayment,
    verifyPayment,
    paystackWebhook,
    getPaymentHistory,
    getInvoices
} = require('../payment/payment.controller');

const { protect } = require('../middleware/authMiddleware');

// Public webhook route
router.post('/webhook', paystackWebhook);

// Protected routes
router.use(protect);

router.post('/initialize', initializePayment);
router.get('/verify/:reference', verifyPayment);
router.get('/history', getPaymentHistory);
router.get('/invoices', getInvoices);

module.exports = router;
