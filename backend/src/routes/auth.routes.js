const express = require('express');
const { z } = require('zod');
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['student', 'coordinator', 'admin']).optional().default('student'),
    phone: z.string().optional(),
    centerId: z.string().optional()
  })
};

const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
};

const refreshSchema = {
  body: z.object({
    refreshToken: z.string().optional()
  })
};

const verifyOtpSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().min(4, 'Verification code is required').max(10)
  })
};

const resendOtpSchema = {
  body: z.object({
    email: z.string().email('Invalid email address')
  })
};

// Routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', validate(resendOtpSchema), authController.resendOtp);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
