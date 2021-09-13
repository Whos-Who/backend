import Redis from 'redis';
import asyncRedis from 'async-redis';

import { REDIS_URL } from '../const/const';

// Use local Redis to manage game state when working in dev mode
const DEFAULT_EXPIRATION = 3600;

// Redis Client intialization
// Blank Redis URL will take localhost and port 6379 as default
export const redisClient = asyncRedis.decorate(Redis.createClient(REDIS_URL));
