import { Request, Response, NextFunction } from 'express';
import { RESPONSE_CODES, ResponseCode } from '@common/constants/response-codes';
import envConfig from '@config/env.config';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code: ResponseCode;

  constructor(message: string, statusCode: number = 500, code?: ResponseCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code || RESPONSE_CODES.INTERNAL_ERROR;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', code?: ResponseCode) {
    super(message, 400, code || RESPONSE_CODES.BAD_REQUEST);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code?: ResponseCode) {
    super(message, 401, code || RESPONSE_CODES.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code?: ResponseCode) {
    super(message, 403, code || RESPONSE_CODES.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code?: ResponseCode) {
    super(message, 404, code || RESPONSE_CODES.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', code?: ResponseCode) {
    super(message, 409, code || RESPONSE_CODES.CONFLICT);
  }
}

export class ValidationError extends AppError {
  public errors: any[];

  constructor(message: string = 'Validation Error', errors: any[] = [], code?: ResponseCode) {
    super(message, 422, code || RESPONSE_CODES.VALIDATION_ERROR);
    this.errors = errors;
  }
}

// Error handler middleware
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const isDevelopment = envConfig.get('NODE_ENV') === 'development';

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err instanceof ValidationError && { errors: err.errors }),
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        success: false,
        code: RESPONSE_CODES.CONFLICT,
        message: 'Resource already exists',
        timestamp: new Date().toISOString(),
        ...(isDevelopment && {
          stack: err.stack,
          prismaCode: prismaError.code,
          meta: prismaError.meta,
        }),
      });
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        success: false,
        code: RESPONSE_CODES.NOT_FOUND,
        message: 'Resource not found',
        timestamp: new Date().toISOString(),
        ...(isDevelopment && {
          stack: err.stack,
          prismaCode: prismaError.code,
        }),
      });
    }

    // Other Prisma errors
    return res.status(500).json({
      success: false,
      code: RESPONSE_CODES.DATABASE_ERROR,
      message: 'Database error',
      timestamp: new Date().toISOString(),
      ...(isDevelopment && {
        stack: err.stack,
        prismaCode: prismaError.code,
        meta: prismaError.meta,
      }),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      code: RESPONSE_CODES.AUTH_TOKEN_INVALID,
      message: 'Invalid token',
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: RESPONSE_CODES.AUTH_TOKEN_EXPIRED,
      message: 'Token expired',
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  // Default error
  console.error('❌ Error:', err);

  return res.status(500).json({
    success: false,
    code: RESPONSE_CODES.INTERNAL_ERROR,
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack }),
  });
};
