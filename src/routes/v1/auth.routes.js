import express from 'express';
import {registerUser, getMe, refreshToken, logout, logoutAll, login} from '../../controller/auth.controller.js';


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

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user by revoking refresh token
 * @access Private
 */
authRouter.post('/logout', logout);


/**
 * @route POST /api/v1/auth/logout-all
 * @desc Logout user from all sessions by revoking all refresh tokens
 * @access Private
 */
authRouter.post('/logout-all', logoutAll);  
 

/**
 * @route POST /api/v1/auth/login
 * @desc Login user and issue tokens
 * @access Public
 */
authRouter.post('/login', login);
export default authRouter;