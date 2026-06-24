import express from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/profile.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateToken, getProfile);
router.put('/', authenticateToken, updateProfile);
router.put('/password', authenticateToken, changePassword);

export default router;
