import sequelize from '../config/database.js';
import User from './User.js';
import Transaction from './Transaction.js';

// Defines one-to-many relationship mapping rules
User.hasMany(Transaction, {
  foreignKey: {
    name: 'userId',
    allowNull: false,
    field: 'user_id'
  },
  as: 'transactions',
  onDelete: 'CASCADE'
});

Transaction.belongsTo(User, {
  foreignKey: {
    name: 'userId',
    allowNull: false,
    field: 'user_id'
  },
  as: 'user'
});

export { sequelize, User, Transaction };