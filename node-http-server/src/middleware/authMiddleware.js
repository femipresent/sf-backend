const jwt = require('jsonwebtoken');
const User = require('../../models/User');

// Protect routes - verify user is authenticated
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            console.log('Token received:', token);
            console.log('JWT Secret:', process.env.JWTSECRET);

            // Verify token
            if (!process.env.JWTSECRET) {
                return res.status(500).json({ success: false, message: 'JWT secret not configured' });
            }
            const decoded = jwt.verify(token, process.env.JWTSECRET);
            console.log('Decoded token:', decoded);

            // Get user from token
            req.user = await User.findById(decoded.userId).select('-password');
            console.log('User found:', req.user);

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            next();
        } catch (error) {
            console.error('Auth error:', error.message);
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
                error: error.message
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
};

// Authorize based on user role
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };