import express from 'express';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../controllers/budget.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(authenticateToken, getBudgets)
  .post(authenticateToken, createBudget);

router.route('/:id')
  .put(authenticateToken, updateBudget)
  .delete(authenticateToken, deleteBudget);

export default router;
