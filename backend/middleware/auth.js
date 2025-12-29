const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate user via JWT token
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided. Please login to continue.'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Get user from token
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found. Token is invalid.'
                });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been deactivated. Please contact administrator.'
                });
            }

            // Attach user to request
            req.user = user;
            next();

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token. Please login again.'
                });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired. Please login again.'
                });
            }
            throw error;
        }

    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed',
            error: error.message
        });
    }
};

// Middleware to authorize based on user roles
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            // Check if user exists in request (set by authenticate middleware)
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Check if user's role is in allowed roles
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
                });
            }

            next();

        } catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authorization failed',
                error: error.message
            });
        }
    };
};

// Optional middleware - allows unauthenticated requests but attaches user if token is valid
const optionalAuth = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('-password');
                
                if (user && user.isActive) {
                    req.user = user;
                }
            } catch (error) {
                // Ignore token errors for optional auth
                console.log('Optional auth - invalid token:', error.message);
            }
        }

        next();

    } catch (error) {
        console.error('Optional auth error:', error);
        next(); // Continue even if there's an error
    }
};

// Middleware to check if user owns the resource or is admin/super_admin
const authorizeOwnerOrAdmin = (resourceUserIdField = 'createdBy') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Super admins and admins can access anything
            if (req.user.role === 'super_admin' || req.user.role === 'admin') {
                return next();
            }

            // Check if resource exists in request (set by previous middleware)
            const resource = req.resource;
            
            if (!resource) {
                return res.status(400).json({
                    success: false,
                    message: 'Resource not found in request'
                });
            }

            // Check if user owns the resource
            const resourceUserId = resource[resourceUserIdField];
            
            if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only access your own resources.'
                });
            }

            next();

        } catch (error) {
            console.error('Owner authorization error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authorization failed',
                error: error.message
            });
        }
    };
};

module.exports = {
    authenticate,
    authorize,
    optionalAuth,
    authorizeOwnerOrAdmin
};

