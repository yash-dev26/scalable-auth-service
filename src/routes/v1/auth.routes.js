import express from 'express';
import {registerUser, getMe, refreshToken} from '../../controller/auth.controller.js';


const authRouter = express.Router();

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post('/register', registerUser);


/**
 * @route GET /api/v1/auth/me
 * @desc Get current user info
 * @access Private
 */
authRouter.get('/me', getMe);


/**
 * @route POST /api/v1/auth/refresh-token
 * @desc Refresh access token using refresh token
 * @access Public (but requires refresh token in cookie)
 */
authRouter.post('/refresh-token', refreshToken);

export default authRouter;