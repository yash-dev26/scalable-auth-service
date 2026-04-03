import express from 'express';
import {registerUser, getMe, refreshToken, logout, logoutAll, login, verifyOTP, forgotPassword, resetPassword} from '../../controller/auth.controller.js';
import {
    strictLimiter,
    mediumLimiter
} from '../../middleware/rateLimit.middleware.js';

const authRouter = express.Router();

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post('/register', mediumLimiter, registerUser);


/**
 * @route POST /api/v1/auth/login
 * @desc Login user and issue tokens
 * @access Public
 */
authRouter.post('/login', strictLimiter, login);


/**
 * @route GET /api/v1/auth/me
 * @desc Get current user info
 * @access Private
 */
authRouter.get('/me', mediumLimiter, getMe);


/**
 * @route POST /api/v1/auth/refresh-token
 * @desc Refresh access token using refresh token
 * @access Public (but requires refresh token in cookie)
 */
authRouter.post('/refresh-token', mediumLimiter, refreshToken);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user by revoking refresh token
 * @access Private
 */
authRouter.post('/logout', mediumLimiter, logout);


/**
 * @route POST /api/v1/auth/logout-all
 * @desc Logout user from all sessions by revoking all refresh tokens
 * @access Private
 */
authRouter.post('/logout-all', mediumLimiter, logoutAll); 


/**
 * @route POST /api/v1/auth/verify-otp
 * @desc Verify OTP for account verification
 * @access Public
 */
authRouter.post('/verify-otp', strictLimiter, verifyOTP); 

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Initiate forgot password flow by sending OTP to email
 * @access Public
 */
authRouter.post('/forgot-password', mediumLimiter, forgotPassword);

/**
 * @route POST /api/v1/auth/reset-password
 * @desc Reset password using email + OTP + new password. Hit when forgot password form is submitted
 * @access Public
 */
authRouter.post('/reset-password', mediumLimiter, resetPassword);

export default authRouter;