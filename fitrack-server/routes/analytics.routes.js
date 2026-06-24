import express from 'express';
import { getMonthlyTrend, getSummary } from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/monthly-trend', authenticateToken, getMonthlyTrend);
router.get('/summary', authenticateToken, getSummary);

export default router;
