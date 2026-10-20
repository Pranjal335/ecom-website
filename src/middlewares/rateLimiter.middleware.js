const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient } = require('../config/redis');
const ApiError = require('../utils/ApiError');

// Generic factory for Redis-backed rate limiters
const createRateLimiter = ({ windowMs, max, message }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Return standard RateLimit-* headers
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:',
    }),
    handler: (req, res, next, options) => {
      throw new ApiError(429, message || 'Too many requests, please try again later.');
    },
  });
};

// 1. Strict Limiter for Auth Routes (brute-force defense)
// 10 requests per 15 minutes per IP
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

// 2. Checkout & Order Limiter (prevents checkout bot spam)
// 20 requests per 5 minutes per IP
const orderLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: 'Too many checkout attempts. Please wait a moment before trying again.',
});

// 3. General Public API Limiter
// 100 requests per minute per IP
const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests across the platform. Throttled.',
});

module.exports = {
  authLimiter,
  orderLimiter,
  generalLimiter,
};