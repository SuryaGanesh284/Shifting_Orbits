const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('./errorHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  let token = null;

  // Extract from Authorization Bearer header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication required: No token provided');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw ApiError.unauthorized('User associated with token no longer exists');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden(`Account is ${user.status}. Please contact an administrator.`);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token expired: Please refresh your session');
    }
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid token signature');
    }
    throw error;
  }
});

module.exports = { authenticate };
