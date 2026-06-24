import Transaction from '../models/Transaction.js';
import { Op, fn, col, literal } from 'sequelize';
import sequelize from '../config/database.js';

// @desc   Get monthly trend (income vs expense) for last 12 months
// @route  GET /api/analytics/monthly-trend
export const getMonthlyTrend = async (req, res) => {
  try {
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      months.push({ label: `${year}-${month}`, year, month });
    }

    const results = await Promise.all(
      months.map(async ({ label, year, month }) => {
        const start = `${year}-${month}-01`;
        const endDate = new Date(year, parseInt(month), 0);
        const end = `${year}-${month}-${String(endDate.getDate()).padStart(2, '0')}`;

        const [income, expense] = await Promise.all([
          Transaction.sum('amount', {
            where: { userId: req.user.id, type: 'income', date: { [Op.between]: [start, end] } }
          }),
          Transaction.sum('amount', {
            where: { userId: req.user.id, type: 'expense', date: { [Op.between]: [start, end] } }
          })
        ]);

        return { month: label, income: parseFloat(income) || 0, expense: parseFloat(expense) || 0 };
      })
    );

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};

// @desc   Get spending summary by category
// @route  GET /api/analytics/summary
export const getSummary = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();

    let start, end;
    if (period === 'month') {
      // Find the latest transaction's month if the current month is empty
      const latestTxn = await Transaction.findOne({
        where: { userId: req.user.id },
        order: [['date', 'DESC']]
      });

      let targetDate = now;
      if (latestTxn) {
        const txnDate = new Date(latestTxn.date);
        
        // Check if there are any transactions in the current calendar month
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthStartStr = `${currentMonthStart.getFullYear()}-${String(currentMonthStart.getMonth() + 1).padStart(2, '0')}-01`;
        
        const hasCurrentMonthTxn = await Transaction.findOne({
          where: {
            userId: req.user.id,
            date: {
              [Op.gte]: currentMonthStartStr
            }
          }
        });

        // Fallback to the latest transaction's month if the current month is empty
        if (!hasCurrentMonthTxn) {
          targetDate = txnDate;
        }
      }

      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      
      // Formatting local dates to YYYY-MM-DD to avoid timezone shifting
      start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    } else if (period === 'year') {
      start = `${now.getFullYear()}-01-01`;
      end = `${now.getFullYear()}-12-31`;
    } else {
      // all time
      start = '2000-01-01';
      end = '2099-12-31';
    }

    const transactions = await Transaction.findAll({
      where: { userId: req.user.id, date: { [Op.between]: [start, end] } }
    });

    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

    // Category breakdown (expenses only)
    const categoryMap = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + parseFloat(t.amount);
    });

    const incomeByCategory = {};
    transactions.filter(t => t.type === 'income').forEach(t => {
      incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + parseFloat(t.amount);
    });

    const expenseByCategory = Object.entries(categoryMap).map(([category, amount]) => ({
      category, amount: parseFloat(amount.toFixed(2))
    })).sort((a, b) => b.amount - a.amount);

    const incomeCategories = Object.entries(incomeByCategory).map(([category, amount]) => ({
      category, amount: parseFloat(amount.toFixed(2))
    })).sort((a, b) => b.amount - a.amount);

    return res.status(200).json({
      success: true,
      data: {
        income: parseFloat(income.toFixed(2)),
        expense: parseFloat(expense.toFixed(2)),
        net: parseFloat((income - expense).toFixed(2)),
        savings_rate: income > 0 ? parseFloat(((income - expense) / income * 100).toFixed(1)) : 0,
        expense_by_category: expenseByCategory,
        income_by_category: incomeCategories
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server Error: ' + error.message });
  }
};
