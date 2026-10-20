const Redis = require('ioredis');

const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

const redisClient = new Redis(redisOptions);

redisClient.on('connect', () => {
  console.log('⚡ Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.warn('⚠️  Redis connection warning/error:', err.message);
});

// Helper utilities for cache management
const cacheGet = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error.message);
    return null;
  }
};

const cacheSet = async (key, value, ttlSeconds = 3600) => {
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error.message);
  }
};

const cacheDel = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error(`Redis DEL error for key ${key}:`, error.message);
  }
};

const cacheDelPattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    console.error(`Redis DEL pattern error for ${pattern}:`, error.message);
  }
};

module.exports = {
  redisClient,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
};