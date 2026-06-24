import Transaction from '../models/Transaction.js';

// @desc    Create a new transaction
// @route   POST /api/transactions
export const createTransaction = async (req, res) => {
  try {
    const { description, amount, type, category, date } = req.body;

    if (!description || !amount || !type || !category || !date) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields.' });
    }

    // Associated user ID will eventually be derived from our auth middleware payload
    const transaction = await Transaction.create({ description, amount, type, category, date });
    return res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// @desc    Get all transactions
// @route   GET /api/transactions
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [['date', 'DESC']]
    });
    return res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};