import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class User extends Model {
  // Automatically strip highly sensitive state fields out of standard API JSON payloads
  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    delete values.failed_login_attempts;
    delete values.lock_until;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true, notEmpty: true },
    },
    display_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    status: {
      type: DataTypes.ENUM('pending_verification', 'active', 'suspended', 'locked'),
      defaultValue: 'active',
      allowNull: false,
    },
    base_currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
      allowNull: false,
      validate: {
        len: [3, 3], // Enforces standard ISO three-letter currency codes
      },
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'UTC',
      allowNull: false,
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lock_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password_changed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true, // Provisions standardized tracking via created_at and updated_at
    underscored: true,
  }
);

export default User;