const Booking = require('../../models/Booking');
const User = require('../../models/User');

// @desc    Get all pending shipments for dispatch
// @route   GET /api/dispatcher/shipments/pending
// @access  Private/Dispatcher
const getPendingShipments = async (req, res) => {
    try {
        const shipments = await Booking.find({ 
            status: { $in: ['draft', 'pending'] }
        })
        .populate('createdBy', 'name email')
        .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: shipments
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get available drivers
// @route   GET /api/dispatcher/drivers/available
// @access  Private/Dispatcher
const getAvailableDrivers = async (req, res) => {
    try {
        const drivers = await User.find({ 
            role: 'driver'
        }).select('name email licenseNumber vehicleInfo');

        res.status(200).json({
            success: true,
            data: drivers
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Assign shipment to driver
// @route   POST /api/dispatcher/shipments/:id/assign
// @access  Private/Dispatcher
const assignShipmentToDriver = async (req, res) => {
    try {
        const { driverId } = req.body;
        
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const driver = await User.findById(driverId);
        
        if (!driver || driver.role !== 'driver') {
            return res.status(400).json({
                success: false,
                message: 'Invalid driver'
            });
        }

        booking.assignedDriver = driverId;
        booking.status = 'assigned';
        
        booking.trackingHistory.push({
            status: 'assigned',
            location: booking.pickup.address.city,
            note: `Assigned to driver ${driver.name}`,
            timestamp: new Date()
        });

        await booking.save();

        res.status(200).json({
            success: true,
            data: booking,
            message: 'Shipment assigned successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Re-assign shipment to different driver
// @route   PATCH /api/dispatcher/shipments/:id/reassign
// @access  Private/Dispatcher
const reassignShipment = async (req, res) => {
    try {
        const { driverId, reason } = req.body;
        
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const driver = await User.findById(driverId);
        
        if (!driver || driver.role !== 'driver') {
            return res.status(400).json({
                success: false,
                message: 'Invalid driver'
            });
        }

        booking.assignedDriver = driverId;
        
        booking.trackingHistory.push({
            status: 'reassigned',
            location: booking.pickup.address.city,
            note: `Reassigned to ${driver.name}. Reason: ${reason}`,
            timestamp: new Date()
        });

        await booking.save();

        res.status(200).json({
            success: true,
            data: booking,
            message: 'Shipment reassigned successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Monitor all active shipments
// @route   GET /api/dispatcher/shipments/active
// @access  Private/Dispatcher
const getActiveShipments = async (req, res) => {
    try {
        const shipments = await Booking.find({ 
            status: { $in: ['assigned', 'picked_up', 'in_transit'] }
        })
        .populate('assignedDriver', 'name email licenseNumber vehicleInfo')
        .populate('createdBy', 'name email')
        .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: shipments
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get dispatch dashboard stats
// @route   GET /api/dispatcher/dashboard
// @access  Private/Dispatcher
const getDispatchDashboard = async (req, res) => {
    try {
        const pending = await Booking.countDocuments({ status: { $in: ['draft', 'pending'] } });
        const assigned = await Booking.countDocuments({ status: 'assigned' });
        const inTransit = await Booking.countDocuments({ status: { $in: ['picked_up', 'in_transit'] } });
        const activeDrivers = await Booking.distinct('assignedDriver', { 
            status: { $in: ['assigned', 'picked_up', 'in_transit'] }
        });

        res.status(200).json({
            success: true,
            data: {
                pendingShipments: pending,
                assignedShipments: assigned,
                inTransitShipments: inTransit,
                activeDriversCount: activeDrivers.length
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
    getPendingShipments,
    getAvailableDrivers,
    assignShipmentToDriver,
    reassignShipment,
    getActiveShipments,
    getDispatchDashboard
};
