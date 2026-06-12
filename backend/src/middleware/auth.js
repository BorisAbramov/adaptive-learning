const { verifyAccessToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const User = require('../models/User');
const logger = require('../utils/logger');

// Verify JWT and attach user to request
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select('-passwordHash -refreshToken');
    if (!user || !user.isActive) {
      return error(res, 'User not found or inactive', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token expired', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 'Invalid token', 401);
    }
    logger.error(`Auth middleware error: ${err.message}`);
    return error(res, 'Authentication failed', 500);
  }
};

// Role-based access control
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return error(res, 'Access denied: insufficient permissions', 403);
    }
    next();
  };
};

module.exports = { protect, restrictTo };
