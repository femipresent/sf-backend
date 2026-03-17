const Invoice = require('../../models/Invoice');
const Booking = require('../../models/Booking');

// @desc    Generate invoice for booking
// @route   POST /api/invoices/generate/:bookingId
// @access  Private/Admin
const generateInvoice = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.status !== 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Can only generate invoice for delivered shipments'
            });
        }

        // Check if invoice already exists
        if (booking.invoice) {
            return res.status(400).json({
                success: false,
                message: 'Invoice already generated for this booking'
            });
        }

        const invoiceNumber = 'INV' + Date.now().toString().slice(-8);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term

        const invoice = await Invoice.create({
            invoiceNumber,
            booking: booking._id,
            customer: booking.createdBy,
            items: [{
                description: `${booking.type} shipment from ${booking.pickup.address.city} to ${booking.delivery.address.city}`,
                quantity: 1,
                unitPrice: booking.pricing.total,
                total: booking.pricing.total
            }],
            subtotal: booking.pricing.subtotal,
            tax: booking.pricing.tax,
            total: booking.pricing.total,
            currency: booking.pricing.currency,
            dueDate
        });

        booking.invoice = invoice._id;
        await booking.save();

        res.status(201).json({
            success: true,
            data: invoice,
            message: 'Invoice generated successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('booking')
            .populate('customer', 'name email');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        res.status(200).json({
            success: true,
            data: invoice
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Mark invoice as paid
// @route   PATCH /api/invoices/:id/pay
// @access  Private
const markInvoicePaid = async (req, res) => {
    try {
        const { paymentMethod } = req.body;

        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        invoice.status = 'paid';
        invoice.paidAt = new Date();
        invoice.paymentMethod = paymentMethod;
        await invoice.save();

        res.status(200).json({
            success: true,
            data: invoice,
            message: 'Invoice marked as paid'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getAllInvoices = async (req, res) => {
    try {
        const { status } = req.query;
        
        const filter = {};
        if (status) filter.status = status;
        
        // Non-admin users can only see their own invoices
        if (req.user.role !== 'admin') {
            filter.customer = req.user._id;
        }

        const invoices = await Invoice.find(filter)
            .populate('customer', 'name email')
            .populate('booking', 'trackingNumber')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: invoices
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    generateInvoice,
    getInvoice,
    markInvoicePaid,
    getAllInvoices
};
