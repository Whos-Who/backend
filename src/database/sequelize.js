import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const logging = process.env.NODE_ENV === 'development' ? false : console.log;
const DATABASE_URL = process.env.DATABASE_URL;

let sequelize;

// NODE_ENV here determines where the migrations are written to, production is live server
// Else it will be written to your local DB

// DB configurations for updates, retrieval etc
if (process.env.NODE_ENV == 'production') {
  sequelize = new Sequelize(DATABASE_URL, {
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
  });
} else {
  sequelize = new Sequelize(DATABASE_URL, {
    logging
  });
}

export default sequelize;
