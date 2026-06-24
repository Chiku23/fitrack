import sequelize from '../config/database.js';
import User from './User.js';
import Transaction from './Transaction.js';
import Budget from './Budget.js';

// User → Transactions
User.hasMany(Transaction, {
  foreignKey: { name: 'userId', allowNull: false, field: 'user_id' },
  as: 'transactions',
  onDelete: 'CASCADE'
});
Transaction.belongsTo(User, {
  foreignKey: { name: 'userId', allowNull: false, field: 'user_id' },
  as: 'user'
});

// User → Budgets
User.hasMany(Budget, {
  foreignKey: { name: 'userId', allowNull: false, field: 'user_id' },
  as: 'budgets',
  onDelete: 'CASCADE'
});
Budget.belongsTo(User, {
  foreignKey: { name: 'userId', allowNull: false, field: 'user_id' },
  as: 'user'
});

export { sequelize, User, Transaction, Budget };