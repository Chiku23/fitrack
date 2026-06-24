import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Transaction extends Model {}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { isNumeric: true },
    },
    type: {
      type: DataTypes.ENUM('income', 'expense'),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    source: {
      type: DataTypes.ENUM('manual', 'import'),
      defaultValue: 'manual',
      allowNull: false,
    },
    // userId is added via association in index.js
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
  }
);

export default Transaction;