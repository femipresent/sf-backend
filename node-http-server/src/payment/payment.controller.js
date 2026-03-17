const axios = require('axios');
const Invoice = require('../../models/Invoice');

// @desc    Initialize payment
// @route   POST /api/payments/initialize
// @access  Private
const initializePayment = async (req, res) => {
    try {
        const { invoiceId } = req.body;

        const invoice = await Invoice.findById(invoiceId).populate('customer', 'email');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        if (invoice.status === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Invoice already paid'
            });
        }

        // Initialize Paystack payment
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: invoice.customer.email,
                amount: invoice.total * 100, // Paystack expects amount in kobo
                reference: `INV-${invoice.invoiceNumber}-${Date.now()}`,
                metadata: {
                    invoiceId: invoice._id,
                    invoiceNumber: invoice.invoiceNumber,
                    customerId: invoice.customer._id
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.status(200).json({
            success: true,
            data: {
                authorizationUrl: response.data.data.authorization_url,
                accessCode: response.data.data.access_code,
                reference: response.data.data.reference
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Verify payment
// @route   GET /api/payments/verify/:reference
// @access  Private
const verifyPayment = async (req, res) => {
    try {
        const { reference } = req.params;

        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                }
            }
        );

        const paymentData = response.data.data;

        if (paymentData.status === 'success') {
            const invoiceId = paymentData.metadata.invoiceId;
            
            const invoice = await Invoice.findById(invoiceId);
            
            if (invoice) {
                invoice.status = 'paid';
                invoice.paidAt = new Date();
                invoice.paymentMethod = 'paystack';
                await invoice.save();
            }

            res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                data: {
                    reference: paymentData.reference,
                    amount: paymentData.amount / 100,
                    status: paymentData.status,
                    paidAt: paymentData.paid_at
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Paystack webhook
// @route   POST /api/payments/webhook
// @access  Public
const paystackWebhook = async (req, res) => {
    try {
        const hash = require('crypto')
            .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (hash !== req.headers['x-paystack-signature']) {
            return res.status(400).json({
                success: false,
                message: 'Invalid signature'
            });
        }

        const event = req.body;

        if (event.event === 'charge.success') {
            const invoiceId = event.data.metadata.invoiceId;
            
            const invoice = await Invoice.findById(invoiceId);
            
            if (invoice && invoice.status !== 'paid') {
                invoice.status = 'paid';
                invoice.paidAt = new Date();
                invoice.paymentMethod = 'paystack';
                await invoice.save();
            }
        }

        res.status(200).send();
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = async (req, res) => {
    try {
        const filter = { status: 'paid' };
        
        if (req.user.role !== 'admin') {
            filter.customer = req.user._id;
        }

        const payments = await Invoice.find(filter)
            .populate('booking', 'trackingNumber')
            .populate('customer', 'name email')
            .sort('-paidAt');

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    initializePayment,
    verifyPayment,
    paystackWebhook,
    getPaymentHistory
};
