const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const env = require('../config/env');
const { ApiError } = require('../middleware/errorHandler');

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
};

const hashToken = async (token) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(token, salt);
};

const registerUser = async ({ name, email, password, role = 'student', phone = '', centerId = 'SOF-BLR-01' }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists');
  }

  const user = new User({
    name,
    email: email.toLowerCase(),
    passwordHash: password,
    role,
    phone,
    centerId
  });

  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokenHash = await hashToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user,
    accessToken,
    refreshToken
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash +refreshTokenHash');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden(`Your account is ${user.status}. Please contact an administrator.`);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokenHash = await hashToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user,
    accessToken,
    refreshToken
  };
};

const refreshAccessToken = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw ApiError.badRequest('Refresh token is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) {
    throw ApiError.unauthorized('Invalid refresh token or session revoked');
  }

  const isTokenMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!isTokenMatch) {
    // Possible token reuse attack - revoke stored token
    user.refreshTokenHash = null;
    await user.save();
    throw ApiError.unauthorized('Security alert: Refresh token mismatch. Please login again.');
  }

  // Issue new access token and rotate refresh token
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshTokenHash = await hashToken(newRefreshToken);
  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};

const logoutUser = async ({ userId }) => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshTokenHash = null;
    await user.save();
  }
  return { message: 'Logged out successfully' };
};

const getUserProfile = async ({ userId }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserProfile,
  generateAccessToken,
  generateRefreshToken
};
