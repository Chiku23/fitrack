import { Budget } from '../models/index.js';
import Transaction from '../models/Transaction.js';
import { Op } from 'sequelize';

// @desc   Get all budgets for the logged-in user with spending progress
// @route  GET /api/budgets
export const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.findAll({ where: { userId: req.user.id } });

    // Calculate spending progress for each budget
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    const yearEnd = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];

    const budgetsWithProgress = await Promise.all(
      budgets.map(async (budget) => {
        const dateRange = budget.period === 'monthly'
          ? { [Op.between]: [monthStart, monthEnd] }
          : { [Op.between]: [yearStart, yearEnd] };

        const transactions = await Transaction.findAll({
          where: { userId: req.user.id, category: budget.category, type: 'expense', date: dateRange }
        });

        const spent = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        return {
          ...budget.toJSON(),
          spent: parseFloat(spent.toFixed(2)),
          remaining: parseFloat((budget.amount_limit - spent).toFixed(2)),
          percentage: Math.round((spent / budget.amount_limit) * 100)
        };
      })
    );

    return res.status(200).json({ success: true, data: budgetsWithProgress });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// @desc   Create a new budget
// @route  POST /api/budgets
export const createBudget = async (req, res) => {
  try {
    const { category, amount_limit, period, start_date } = req.body;

    if (!category || !amount_limit || !period || !start_date) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields.' });
    }

    const budget = await Budget.create({
      category, amount_limit, period, start_date, userId: req.user.id
    });

    return res.status(201).json({ success: true, data: budget });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// @desc   Update a budget
// @route  PUT /api/budgets/:id
export const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });

    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget not found.' });
    }

    const { category, amount_limit, period, start_date } = req.body;
    await budget.update({ category, amount_limit, period, start_date });

    return res.status(200).json({ success: true, data: budget });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// @desc   Delete a budget
// @route  DELETE /api/budgets/:id
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });

    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget not found.' });
    }

    await budget.destroy();
    return res.status(200).json({ success: true, message: 'Budget deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};
