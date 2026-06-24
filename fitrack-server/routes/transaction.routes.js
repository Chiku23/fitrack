import express from 'express';
import { createTransaction, getTransactions } from '../controllers/transaction.controller.js';

const router = express.Router();

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

export default router;