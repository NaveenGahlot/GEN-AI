import express from 'express';
import { getMe, loginUser, logoutUser, registerUser } from '../controllers/auth.controller.js';
import authenticateUser from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route POST /api/auths/register
 * @description Register a new user
 * @access Public
 */
router.post('/register', registerUser);
/**
 * @route POST /api/auths/login
 * @description Login a user with email or password
 * @access Public
 */
router.post('/login', loginUser);
/**
 * @route GET /api/auths/logout
 * @description Logout a user by clearing the cookie
 * @access Public
 */
router.get('/logout', logoutUser);

/**
 * @route GET /api/auths/get-me
 * @description Get the authenticated user's information
 * @access Private
 */
router.get('/get-me', authenticateUser, getMe);

export default router;