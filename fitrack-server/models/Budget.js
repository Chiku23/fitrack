import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Budget extends Model {}

Budget.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    amount_limit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { isNumeric: true, min: 0.01 },
    },
    period: {
      type: DataTypes.ENUM('monthly', 'yearly'),
      defaultValue: 'monthly',
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    // userId is added via association in index.js
  },
  {
    sequelize,
    modelName: 'Budget',
    tableName: 'budgets',
    timestamps: true,
    underscored: true,
  }
);

export default Budget;
