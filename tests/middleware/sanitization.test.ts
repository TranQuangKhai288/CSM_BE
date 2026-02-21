import {
  sanitizeString,
  preventNoSQLInjection,
  detectSQLInjection,
} from '@middleware/sanitization.middleware';
import { Request, Response, NextFunction } from 'express';

describe('Sanitization Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('preventNoSQLInjection', () => {
    it('should remove $ from object keys', () => {
      mockReq.body = {
        name: 'test',
        $where: 'malicious code',
      };

      preventNoSQLInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body).not.toHaveProperty('$where');
      expect(mockReq.body).toHaveProperty('name', 'test');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should remove . from object keys', () => {
      mockReq.body = {
        'user.password': 'test',
        name: 'valid',
      };

      preventNoSQLInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body).not.toHaveProperty('user.password');
      expect(mockReq.body).toHaveProperty('name', 'valid');
    });
  });

  describe('detectSQLInjection', () => {
    it('should detect SQL injection attempts', () => {
      mockReq.body = {
        email: "'; DROP TABLE users; --",
      };

      mockRes.status = jest.fn().mockReturnThis();
      mockRes.json = jest.fn();

      detectSQLInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid input detected',
        })
      );
    });

    it('should allow valid inputs', () => {
      mockReq.body = {
        email: 'test@example.com',
        name: 'John Doe',
      };

      detectSQLInjection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
