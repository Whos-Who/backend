import Redis from 'redis';
import { REDIS_URL } from '../const/const';

// Use local Redis to manage game state when working in dev mode
const DEFAULT_EXPIRATION = 3600;

// Redis Client intialization
// Blank Redis URL will take localhost and port 6379 as default
export const redisClient = Redis.createClient(REDIS_URL);
