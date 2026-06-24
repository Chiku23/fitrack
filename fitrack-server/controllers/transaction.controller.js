import Transaction from '../models/Transaction.js';
import { Op } from 'sequelize';


// @desc   Create a new transaction
// @route  POST /api/transactions
export const createTransaction = async (req, res) => {
  try {
    const { description, amount, type, category, date, notes, payment_method } = req.body;

    if (!description || !amount || !type || !category || !date) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields.' });
    }

    const transaction = await Transaction.create({
      description,
      amount,
      type,
      category,
      date,
      notes: notes || null,
      payment_method: payment_method || null,
      source: 'manual',
      userId: req.user.id
    });

    return res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// @desc   Get all transactions for the logged-in user
// @route  GET /api/transactions
export const getTransactions = async (req, res) => {
  try {
    const { type, category, from, to, page = 1, limit = 100 } = req.query;

    const where = { userId: req.user.id };
    if (type) where.type = type;
    if (category) where.category = category;
    if (from || to) {
      where.date = {};
      if (from) where.date[Op.gte] = from;
      if (to) where.date[Op.lte] = to;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Transaction.findAndCountAll({
      where,
      order: [['date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return res.status(200).json({
      success: true,
      count: rows.length,
      total: count,
      pages: Math.ceil(count / parseInt(limit)),
      data: rows
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// @desc   Update a transaction
// @route  PUT /api/transactions/:id
export const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }

    const { description, amount, type, category, date, notes, payment_method } = req.body;
    await transaction.update({ description, amount, type, category, date, notes, payment_method });

    return res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// @desc   Delete a transaction
// @route  DELETE /api/transactions/:id
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }

    await transaction.destroy();
    return res.status(200).json({ success: true, message: 'Transaction deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// @desc   Bulk delete transactions
// @route  POST /api/transactions/bulk-delete
export const bulkDeleteTransactions = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide an array of transaction IDs.' });
    }

    const deletedCount = await Transaction.destroy({
      where: {
        id: { [Op.in]: ids },
        userId: req.user.id
      }
    });

    return res.status(200).json({ success: true, count: deletedCount, message: `${deletedCount} transactions deleted.` });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};