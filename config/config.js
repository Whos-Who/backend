const dotenv = require('dotenv');
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

module.exports = {
  development: {
    url: DATABASE_URL,
    dialect: 'postgres',
    seederStorage: 'sequelize'
  },
  production: {
    url: DATABASE_URL,
    dialect: 'postgres',
    seederStorage: 'sequelize'
  }
};
