const Booking = require('../models/Booking');
const BulkShipment = require('../models/BulkShipment');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    try {
        const { type, pickup, delivery, services, itemDetails } = req.body;

        // Calculate pricing based on selected services
        let subtotal = 0;
        if (services.ftl.selected) subtotal += services.ftl.price;
        if (services.ltl.selected) subtotal += services.ltl.price;
        if (services.lastMile.selected) subtotal += services.lastMile.price;
        if (services.express.selected) subtotal += services.express.price;

        // Calculate tax ( 7.5% VAT)
        const taxRate = 0.075;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        // Generate tracking number (you can customize this)
        const trackingNumber = 'SF' + Date.now().toString().slice(-8) + Math.random().toString(36).substring(2, 5).toUpperCase();

        const bookingData = {
            type,
            status: 'draft',
            pickup,
            delivery,
            services,
            pricing: {
                subtotal,
                tax,
                total,
                currency: 'NGN'
            },
            trackingNumber,
            itemDetails: type === 'single' ? itemDetails : undefined,
            createdBy: req.user._id // Assuming you have user from auth middleware
        };

        const booking = await Booking.create(bookingData);

        res.status(201).json({
            success: true,
            data: booking,
            message: 'Booking created successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
const getBookings = async (req, res) => {
    try {
        const { status, type, page = 1, limit = 10 } = req.query;
        
        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        
        // Add user filter for non-admin users
        if (req.user.role !== 'admin') {
            filter.createdBy = req.user._id;
        }

        const bookings = await Booking.find(filter)
            .populate('createdBy', 'name email')
            .populate('bulkShipmentId')
            .sort('-createdAt')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Booking.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: bookings,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('bulkShipmentId');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user has permission to view this booking
        if (req.user.role !== 'admin' && booking.createdBy._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this booking'
            });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = async (req, res) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user has permission to update
        if (req.user.role !== 'admin' && booking.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this booking'
            });
        }

        // Only allow updates if booking is in draft or pending status
        if (!['draft', 'pending'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update booking once it is in progress'
            });
        }

        // Recalculate pricing if services changed
        if (req.body.services) {
            let subtotal = 0;
            const services = req.body.services;
            
            if (services.ftl?.selected) subtotal += services.ftl.price || 45000;
            if (services.ltl?.selected) subtotal += services.ltl.price || 12000;
            if (services.lastMile?.selected) subtotal += services.lastMile.price || 1800;
            if (services.express?.selected) subtotal += services.express.price || 2500;

            const taxRate = 0.075;
            const tax = subtotal * taxRate;
            const total = subtotal + tax;

            req.body.pricing = {
                subtotal,
                tax,
                total,
                currency: 'NGN'
            };
        }

        booking = await Booking.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: booking,
            message: 'Booking updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = async (req, res) => {
    try {
        const { status, location, note } = req.body;
        
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Add to tracking history
        booking.trackingHistory.push({
            status,
            location,
            note,
            timestamp: new Date()
        });

        // Update status
        booking.status = status;
        
        await booking.save();

        res.status(200).json({
            success: true,
            data: booking,
            message: `Booking status updated to ${status}`
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Only allow deletion of draft bookings
        if (booking.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Can only delete draft bookings'
            });
        }

        // If it's a bulk shipment, delete the associated bulk shipment too
        if (booking.bulkShipmentId) {
            await BulkShipment.findByIdAndDelete(booking.bulkShipmentId);
        }

        await booking.remove();

        res.status(200).json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get booking by tracking number
// @route   GET /api/bookings/track/:trackingNumber
// @access  Public
const trackBooking = async (req, res) => {
    try {
        console.log('Tracking number:', req.params.trackingNumber);
        const booking = await Booking.findOne({ 
            trackingNumber: req.params.trackingNumber 
        }).select('status trackingHistory pickup delivery trackingNumber');
        console.log('Booking found:', booking);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                trackingNumber: booking.trackingNumber,
                status: booking.status,
                trackingHistory: booking.trackingHistory,
                pickup: booking.pickup,
                delivery: booking.delivery
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get user's booking statistics
// @route   GET /api/bookings/stats
// @access  Private
const getBookingStats = async (req, res) => {
    try {
        const stats = await Booking.aggregate([
            {
                $match: { 
                    createdBy: req.user._id 
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$pricing.total' }
                }
            }
        ]);

        const totalBookings = await Booking.countDocuments({ 
            createdBy: req.user._id 
        });

        res.status(200).json({
            success: true,
            data: {
                stats,
                totalBookings
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createBooking,
    getBookings,
    getBooking,
    updateBooking,
    updateBookingStatus,
    deleteBooking,
    trackBooking,
    getBookingStats
};