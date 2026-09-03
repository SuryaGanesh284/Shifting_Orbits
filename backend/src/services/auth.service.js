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

const Student = require('../models/Student');
const { sendOtpEmail } = require('./email.service');

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const registerUser = async ({ name, email, password, role = 'student', phone = '', centerId = 'SOF-BLR-01' }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    // If account was created but email was never verified, allow re-triggering OTP verification!
    if (!existingUser.isEmailVerified) {
      const otp = generateOtp();
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(otp, salt);

      existingUser.name = name;
      existingUser.passwordHash = password;
      existingUser.role = role;
      existingUser.phone = phone;
      existingUser.centerId = centerId;
      existingUser.verificationOtp = {
        code: hashedOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      };
      await existingUser.save();

      await sendOtpEmail(existingUser.email, otp, existingUser.name);

      return {
        user: existingUser,
        requiresVerification: true,
        email: existingUser.email,
        message: 'A 6-digit verification code has been sent to your email.'
      };
    }
    throw ApiError.conflict('An account with this email address already exists');
  }

  const otp = generateOtp();
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp, salt);

  const user = new User({
    name,
    email: email.toLowerCase(),
    passwordHash: password,
    role,
    phone,
    centerId,
    isEmailVerified: false,
    verificationOtp: {
      code: hashedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });

  await user.save();

  // Send verification code to email
  await sendOtpEmail(user.email, otp, user.name);

  return {
    user,
    requiresVerification: true,
    email: user.email,
    message: 'Registration initiated! A 6-digit verification code has been sent to your email.'
  };
};

const verifyOtp = async ({ email, otp }) => {
  if (!email || !otp) {
    throw ApiError.badRequest('Email and OTP verification code are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+verificationOtp.code +verificationOtp.expiresAt');
  if (!user) {
    throw ApiError.notFound('User not found with this email address');
  }

  if (user.isEmailVerified) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshTokenHash = await hashToken(refreshToken);
    user.lastLoginAt = new Date();
    await user.save();
    return {
      user,
      accessToken,
      refreshToken,
      message: 'Account is already verified'
    };
  }

  if (!user.verificationOtp || !user.verificationOtp.code) {
    throw ApiError.badRequest('No active verification code found. Please request a new code.');
  }

  if (new Date() > new Date(user.verificationOtp.expiresAt)) {
    throw ApiError.badRequest('Verification code has expired. Please request a new code.');
  }

  const isMatch = await bcrypt.compare(otp.trim(), user.verificationOtp.code);
  if (!isMatch) {
    throw ApiError.badRequest('Invalid verification code. Please check and try again.');
  }

  // Mark email as verified and clear OTP
  user.isEmailVerified = true;
  user.verificationOtp = { code: null, expiresAt: null };

  // If registering as student, ensure Student document exists
  if (user.role === 'student') {
    const existingStudent = await Student.findOne({ userId: user._id });
    if (!existingStudent) {
      await Student.create({
        userId: user._id,
        centerId: user.centerId || 'SOF-BLR-01',
        program: 'Sethu',
        stage: 'Grade 11'
      });
    }
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokenHash = await hashToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user,
    accessToken,
    refreshToken,
    message: 'Email verified successfully! Welcome to Shifting Orbits Foundation.'
  };
};

const resendOtp = async ({ email }) => {
  if (!email) {
    throw ApiError.badRequest('Email is required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+verificationOtp.code +verificationOtp.expiresAt');
  if (!user) {
    throw ApiError.notFound('User not found with this email address');
  }

  if (user.isEmailVerified) {
    throw ApiError.badRequest('This account is already verified. Please log in.');
  }

  const otp = generateOtp();
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp, salt);

  user.verificationOtp = {
    code: hashedOtp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  };
  await user.save();

  await sendOtpEmail(user.email, otp, user.name);

  return {
    success: true,
    message: 'A fresh verification code has been dispatched to your email.'
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

  // If email is not verified, require verification and send fresh OTP
  if (!user.isEmailVerified) {
    const otp = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    user.verificationOtp = {
      code: hashedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    await user.save();

    await sendOtpEmail(user.email, otp, user.name);

    return {
      requiresVerification: true,
      email: user.email,
      message: 'Your account is not verified yet. A verification code has been sent to your email address.'
    };
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
  verifyOtp,
  resendOtp,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserProfile,
  generateAccessToken,
  generateRefreshToken
};
