// import Redis from 'redis';
// import asyncRedis from 'async-redis';
import Redis from 'ioredis';

import { REDIS_URL } from '../const/const';
// Use local Redis to manage game state when working in dev mode
export const DEFAULT_EXPIRATION = 3600;

// Redis Client intialization
// Blank Redis URL will take localhost and port 6379 as default
// export const redisClient = asyncRedis.decorate(Redis.createClient(REDIS_URL));
export const redisClient = new Redis(REDIS_URL);
