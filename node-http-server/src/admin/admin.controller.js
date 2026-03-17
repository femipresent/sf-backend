const Booking = require('../../models/Booking');
const User = require('../../models/User');

// @desc    Get all drivers
// @route   GET /api/admin/drivers
// @access  Private/Admin
const getAllDrivers = async (req, res) => {
    try {
        const drivers = await User.find({ role: 'driver' })
            .select('-password')
            .sort('-createdAt');

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

// @desc    Activate/Deactivate driver
// @route   PATCH /api/admin/drivers/:id/status
// @access  Private/Admin
const updateDriverStatus = async (req, res) => {
    try {
        const { isActive } = req.body;
        
        const driver = await User.findById(req.params.id);
        
        if (!driver || driver.role !== 'driver') {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        driver.isActive = isActive;
        await driver.save();

        res.status(200).json({
            success: true,
            data: driver,
            message: `Driver ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all users by role
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        
        const filter = role ? { role } : {};
        const users = await User.find(filter)
            .select('-password')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get operations dashboard
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalShipments = await Booking.countDocuments();
        const todayShipments = await Booking.countDocuments({ 
            createdAt: { $gte: today } 
        });
        
        const deliveredShipments = await Booking.countDocuments({ 
            status: 'delivered' 
        });
        
        const onTimeDeliveryRate = totalShipments > 0 
            ? ((deliveredShipments / totalShipments) * 100).toFixed(2) 
            : 0;

        const totalRevenue = await Booking.aggregate([
            { $match: { status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$pricing.total' } } }
        ]);

        const activeDrivers = await User.countDocuments({ 
            role: 'driver',
            isActive: true 
        });

        const totalDrivers = await User.countDocuments({ role: 'driver' });
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalDispatchers = await User.countDocuments({ role: 'dispatcher' });

        res.status(200).json({
            success: true,
            data: {
                shipments: {
                    total: totalShipments,
                    today: todayShipments,
                    delivered: deliveredShipments,
                    onTimeRate: onTimeDeliveryRate
                },
                revenue: {
                    total: totalRevenue[0]?.total || 0,
                    currency: 'NGN'
                },
                users: {
                    drivers: totalDrivers,
                    activeDrivers,
                    customers: totalUsers,
                    dispatchers: totalDispatchers
                }
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get delivery reports
// @route   GET /api/admin/reports/deliveries
// @access  Private/Admin
const getDeliveryReports = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        
        const filter = {};
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (status) filter.status = status;

        const bookings = await Booking.find(filter)
            .populate('createdBy', 'name email')
            .populate('assignedDriver', 'name email')
            .sort('-createdAt');

        const summary = await Booking.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$pricing.total' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                bookings,
                summary
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get driver performance report
// @route   GET /api/admin/reports/driver-performance
// @access  Private/Admin
const getDriverPerformance = async (req, res) => {
    try {
        const performance = await Booking.aggregate([
            { $match: { assignedDriver: { $exists: true } } },
            {
                $group: {
                    _id: '$assignedDriver',
                    totalDeliveries: { $sum: 1 },
                    completedDeliveries: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                    },
                    totalRevenue: { $sum: '$pricing.total' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'driver'
                }
            },
            { $unwind: '$driver' },
            {
                $project: {
                    driverName: '$driver.name',
                    driverEmail: '$driver.email',
                    totalDeliveries: 1,
                    completedDeliveries: 1,
                    onTimeRate: {
                        $multiply: [
                            { $divide: ['$completedDeliveries', '$totalDeliveries'] },
                            100
                        ]
                    },
                    totalRevenue: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: performance
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get revenue reports
// @route   GET /api/admin/reports/revenue
// @access  Private/Admin
const getRevenueReports = async (req, res) => {
    try {
        const { period } = req.query; // daily, weekly, monthly
        
        let groupBy;
        switch(period) {
            case 'daily':
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
                break;
            case 'weekly':
                groupBy = { $week: '$createdAt' };
                break;
            case 'monthly':
                groupBy = { $month: '$createdAt' };
                break;
            default:
                groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        }

        const revenue = await Booking.aggregate([
            { $match: { status: 'delivered' } },
            {
                $group: {
                    _id: groupBy,
                    totalRevenue: { $sum: '$pricing.total' },
                    totalShipments: { $sum: 1 },
                    avgOrderValue: { $avg: '$pricing.total' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: revenue
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllDrivers,
    updateDriverStatus,
    getAllUsers,
    getAdminDashboard,
    getDeliveryReports,
    getDriverPerformance,
    getRevenueReports
};
