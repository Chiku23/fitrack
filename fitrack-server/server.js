import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { sequelize } from './models/index.js';

// Import endpoint route managers
// Extension names (.js) are strictly required for native Node.js ES Modules execution
import authRoutes from './routes/auth.routes.js';
import transactionRoutes from './routes/transaction.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable cross-origin resource sharing for clients mapped under the environment file
app.use(cors({ origin: process.env.FRONTEND_URL }));

// Inbound payload processing middleware
app.use(express.json());

// Application routing layer definitions
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// General health check verification endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FiTrack Backend running under ES Module scope' });
});

// Structural schema verification prior to initialization
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronization completed successfully.');
    app.listen(PORT, () => {
      console.log(`Server executing operations on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database initialization phase encountered a critical failure:', error);
  });