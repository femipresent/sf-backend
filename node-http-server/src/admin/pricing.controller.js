const Rate = require('../../models/Rate');

// @desc    Create rate configuration
// @route   POST /api/admin/rates
// @access  Private/Admin
const createRate = async (req, res) => {
    try {
        const { serviceType, baseRate, perKmRate, perKgRate, surcharges } = req.body;

        const rate = await Rate.create({
            serviceType,
            baseRate,
            perKmRate,
            perKgRate,
            surcharges,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            data: rate,
            message: 'Rate created successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all rates
// @route   GET /api/admin/rates
// @access  Private/Admin
const getAllRates = async (req, res) => {
    try {
        const rates = await Rate.find().sort('-createdAt');

        res.status(200).json({
            success: true,
            data: rates
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update rate
// @route   PUT /api/admin/rates/:id
// @access  Private/Admin
const updateRate = async (req, res) => {
    try {
        const rate = await Rate.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!rate) {
            return res.status(404).json({
                success: false,
                message: 'Rate not found'
            });
        }

        res.status(200).json({
            success: true,
            data: rate,
            message: 'Rate updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Calculate quote
// @route   POST /api/rates/calculate
// @access  Public
const calculateQuote = async (req, res) => {
    try {
        const { serviceType, distance, weight } = req.body;

        const rate = await Rate.findOne({ serviceType, isActive: true });

        if (!rate) {
            return res.status(404).json({
                success: false,
                message: 'Rate not found for this service type'
            });
        }

        let subtotal = rate.baseRate;
        if (distance) subtotal += distance * rate.perKmRate;
        if (weight) subtotal += weight * rate.perKgRate;

        // Add surcharges
        subtotal += rate.surcharges.fuel || 0;
        subtotal += rate.surcharges.peakHours || 0;
        subtotal += rate.surcharges.specialHandling || 0;

        const taxRate = 0.075;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        res.status(200).json({
            success: true,
            data: {
                serviceType,
                baseRate: rate.baseRate,
                distanceCharge: distance * rate.perKmRate,
                weightCharge: weight * rate.perKgRate,
                surcharges: rate.surcharges,
                subtotal,
                tax,
                total,
                currency: 'NGN'
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
    createRate,
    getAllRates,
    updateRate,
    calculateQuote
};
