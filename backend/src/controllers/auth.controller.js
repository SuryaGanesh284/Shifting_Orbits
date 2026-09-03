const authService = require('../services/auth.service');
const { asyncHandler } = require('../middleware/errorHandler');
const env = require('../config/env');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);

  if (result.requiresVerification) {
    return res.status(201).json({
      success: true,
      requiresVerification: true,
      email: result.email,
      message: result.message
    });
  }

  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyOtp(req.body);

  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }
  });
});

const resendOtp = asyncHandler(async (req, res) => {
  const result = await authService.resendOtp(req.body);

  res.status(200).json({
    success: true,
    message: result.message
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);

  if (result.requiresVerification) {
    return res.status(403).json({
      success: false,
      requiresVerification: true,
      email: result.email,
      message: result.message
    });
  }

  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }
  });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
  const result = await authService.refreshAccessToken({ refreshToken });

  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    message: 'Access token refreshed successfully',
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser({ userId: req.user._id });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile({ userId: req.user._id });

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout,
  getMe
};
