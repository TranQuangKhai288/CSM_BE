import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

/**
 * Input sanitization middleware
 * Prevents XSS, SQL injection, and other injection attacks
 */

/**
 * Sanitize a string value
 */
function sanitizeString(value: string): string {
  // Trim whitespace
  let sanitized = value.trim();

  // Escape HTML to prevent XSS
  sanitized = validator.escape(sanitized);

  // Remove any null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Sanitize the key as well
        const sanitizedKey = sanitizeString(key);
        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Middleware to sanitize request body, query, and params
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to prevent NoSQL injection
 * Removes $ and . from keys which are dangerous in MongoDB/NoSQL queries
 */
export const preventNoSQLInjection = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const sanitize = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map((item) => sanitize(item));
      }

      const cleaned: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          // Remove keys starting with $ or containing .
          if (key.startsWith('$') || key.includes('.')) {
            continue; // Skip dangerous keys
          }
          cleaned[key] = sanitize(obj[key]);
        }
      }
      return cleaned;
    };

    if (req.body) {
      req.body = sanitize(req.body);
    }

    if (req.query) {
      req.query = sanitize(req.query);
    }

    if (req.params) {
      req.params = sanitize(req.params);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to detect and block SQL injection attempts
 */
export const detectSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(;|\-\-|\/\*|\*\/|xp_|sp_)/gi,
    /('|")\s*(OR|AND)\s*('|")?[0-9]/gi,
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return sqlPatterns.some((pattern) => pattern.test(value));
    }

    if (Array.isArray(value)) {
      return value.some((item) => checkValue(item));
    }

    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some((val) => checkValue(val));
    }

    return false;
  };

  try {
    const hasSQLInjection = checkValue(req.body) || checkValue(req.query) || checkValue(req.params);

    if (hasSQLInjection) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input detected',
        code: 'INVALID_INPUT',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Combined security middleware
 */
export const securityMiddleware = [preventNoSQLInjection, sanitizeInput];
