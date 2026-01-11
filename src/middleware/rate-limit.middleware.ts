import rateLimit from 'express-rate-limit';
import envConfig from '@config/env.config';

export const rateLimitMiddleware = rateLimit({
  windowMs: envConfig.get('RATE_LIMIT_WINDOW_MS'),
  max: envConfig.get('RATE_LIMIT_MAX_REQUESTS'),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain IPs (e.g., localhost in development)
  skip: (req) => {
    if (envConfig.isDevelopment()) {
      const ip = req.ip || req.socket.remoteAddress;
      return ip === '127.0.0.1' || ip === '::1';
    }
    return false;
  },
});

// Stricter rate limit for auth endpoints
export const authRateLimitMiddleware = rateLimit({
  windowMs: 0.25 * 60 * 1000, // 15 seconds
  max: 10, // 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
