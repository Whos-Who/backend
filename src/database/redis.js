import Redis from 'redis';

// Use local Redis to manage game state when working in dev mode
const REDIS_URL = process.env.REDIS_URL || '';

const DEFAULT_EXPIRATION = 3600;

// Redis Client intialization
// Blank Redis URL will take localhost and port 6379 as default
export const redisClient = Redis.createClient(REDIS_URL);
