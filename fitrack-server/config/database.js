import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_STORAGE || './fitrack.sqlite',
  logging: false 
});

export default sequelize;