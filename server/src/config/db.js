const { Sequelize } = require('sequelize');

const dialectOptions = {};
if (process.env.NODE_ENV === 'production') {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false,
  };
}

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  logging: false,
  dialectOptions,
});

module.exports = sequelize;
