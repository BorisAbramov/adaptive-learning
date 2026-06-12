const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed', 400, errors.array());
    }

    const { email, password, firstName, lastName } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return error(res, 'Email already registered', 409);
    }

    const user = await User.create({
      email,
      passwordHash: password, // pre-save hook will hash it
      profile: { firstName, lastName }
    });

    const accessToken  = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to DB
    await User.findByIdAndUpdate(user._id, { refreshToken });

    logger.info(`New user registered: ${email}`);
    return success(res, { accessToken, refreshToken, user }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed', 400, errors.array());
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.isActive) {
      return error(res, 'Invalid credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return error(res, 'Invalid credentials', 401);
    }

    const accessToken  = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
      refreshToken,
      lastLoginAt: new Date()
    });

    // Remove sensitive fields before sending
    user.passwordHash = undefined;

    logger.info(`User logged in: ${email}`);
    return success(res, { accessToken, refreshToken, user }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return error(res, 'Refresh token required', 400);
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return error(res, 'Invalid refresh token', 401);
    }

    const newAccessToken  = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    return success(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, 'Token refreshed');
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Refresh token expired, please login again', 401);
    }
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  return success(res, { user: req.user }, 'Current user');
};

module.exports = { register, login, refresh, logout, getMe };
