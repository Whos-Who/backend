const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  development: {
    username: 'postgres',
    database: 'assignment-3',
    host: '127.0.0.1',
    port: '5432',
    dialect: 'postgres'
  },
  production: {
    use_env_variable: process.env.DATABASE_URL,
    dialect: 'postgres'
  }
};
