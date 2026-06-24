import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { sequelize } from './models/index.js';

import authRoutes from './routes/auth.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import profileRoutes from './routes/profile.routes.js';
import importRoutes from './routes/import.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/import', importRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FiTrack API running', version: '2.0.0' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

sequelize.sync()
  .then(() => {
    console.log('Database synchronized.');
    app.listen(PORT, () => console.log(`FiTrack server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('Database sync failed:', error);
  });