import express from 'express';
import { createTransaction, getTransactions, updateTransaction, deleteTransaction, bulkDeleteTransactions } from '../controllers/transaction.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(authenticateToken, getTransactions)
  .post(authenticateToken, createTransaction);

router.post('/bulk-delete', authenticateToken, bulkDeleteTransactions);

router.route('/:id')
  .put(authenticateToken, updateTransaction)
  .delete(authenticateToken, deleteTransaction);

export default router;