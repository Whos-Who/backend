import dotenv from 'dotenv';

import { Sequelize } from 'sequelize';
import { DATABASE_URL, NODE_ENV } from '../const/const';

dotenv.config();

const logging = NODE_ENV === 'development' ? false : console.log;

let sequelize;

// NODE_ENV here determines where the migrations are written to, production is live server
// Else it will be written to your local DB

// DB configurations for updates, retrieval etc
if (NODE_ENV === 'production') {
  sequelize = new Sequelize(DATABASE_URL, {
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
  });
} else {
  sequelize = new Sequelize(DATABASE_URL, {
    logging
  });
}

export default sequelize;
