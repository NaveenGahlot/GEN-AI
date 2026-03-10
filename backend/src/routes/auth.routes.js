import express from 'express';
import { loginUser, logoutUser, registerUser } from '../controllers/auth.controller.js';

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
 * @route POST /api/auths/logout
 * @description Logout a user
 * @access Public
 */
router.post('/logout', logoutUser);

export default router;