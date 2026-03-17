const Booking = require('../../models/Booking');

// @desc    Get assigned bookings for driver
// @route   GET /api/driver/bookings
// @access  Private/Driver
const getAssignedBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ 
            assignedDriver: req.user._id,
            status: { $in: ['assigned', 'picked_up', 'in_transit'] }
        }).sort('-createdAt');

        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update delivery status
// @route   PATCH /api/driver/bookings/:id/status
// @access  Private/Driver
const updateDeliveryStatus = async (req, res) => {
    try {
        const { status, location, note } = req.body;
        
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if driver is assigned to this booking
        if (booking.assignedDriver?.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this booking'
            });
        }

        // Add to tracking history
        booking.trackingHistory.push({
            status,
            location,
            note,
            timestamp: new Date()
        });

        booking.status = status;
        await booking.save();

        res.status(200).json({
            success: true,
            data: booking,
            message: `Status updated to ${status}`
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Upload proof of delivery
// @route   POST /api/driver/bookings/:id/proof
// @access  Private/Driver
const uploadProofOfDelivery = async (req, res) => {
    try {
        const { recipientName, recipientSignature, deliveryNotes, photoUrl } = req.body;
        
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.assignedDriver?.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        booking.proofOfDelivery = {
            recipientName,
            recipientSignature,
            deliveryNotes,
            photoUrl,
            deliveredBy: req.user._id,
            deliveredAt: new Date()
        };

        booking.status = 'delivered';
        
        // Add to tracking history
        booking.trackingHistory.push({
            status: 'delivered',
            location: booking.delivery.address.city,
            note: 'Package delivered successfully',
            timestamp: new Date()
        });

        await booking.save();

        res.status(200).json({
            success: true,
            data: booking,
            message: 'Proof of delivery uploaded successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Report failed delivery
// @route   POST /api/driver/bookings/:id/failed
// @access  Private/Driver
const reportFailedDelivery = async (req, res) => {
    try {
        const { reason, photoUrl, notes, nextAttemptDate } = req.body;
        
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.assignedDriver?.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        booking.failedDelivery = {
            attemptDate: new Date(),
            reason,
            photoUrl,
            notes,
            nextAttemptDate
        };

        booking.status = 'pending';
        
        // Add to tracking history
        booking.trackingHistory.push({
            status: 'failed_attempt',
            location: booking.delivery.address.city,
            note: `Delivery failed: ${reason}`,
            timestamp: new Date()
        });

        await booking.save();

        res.status(200).json({
            success: true,
            data: booking,
            message: 'Failed delivery reported'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get delivery history for driver
// @route   GET /api/driver/history
// @access  Private/Driver
const getDeliveryHistory = async (req, res) => {
    try {
        const bookings = await Booking.find({ 
            assignedDriver: req.user._id,
            status: 'delivered'
        }).sort('-createdAt').limit(50);

        const stats = {
            totalDeliveries: bookings.length,
            thisMonth: bookings.filter(b => {
                const bookingDate = new Date(b.updatedAt);
                const now = new Date();
                return bookingDate.getMonth() === now.getMonth() && 
                       bookingDate.getFullYear() === now.getFullYear();
            }).length
        };

        res.status(200).json({
            success: true,
            data: {
                bookings,
                stats
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
    getAssignedBookings,
    updateDeliveryStatus,
    uploadProofOfDelivery,
    reportFailedDelivery,
    getDeliveryHistory
};
