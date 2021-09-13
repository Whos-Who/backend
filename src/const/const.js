import dotenv from 'dotenv';
dotenv.config();

export const REDIS_URL = process.env.REDIS_URL || '';
export const DATABASE_URL = process.env.DATABASE_URL;
export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
