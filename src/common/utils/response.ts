import { Request, Response } from 'express';
import { RESPONSE_CODES, ResponseCode } from '@common/constants/response-codes';

interface ApiResponse<T = any> {
  success: boolean;
  code: ResponseCode;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
  timestamp: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  code?: ResponseCode
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    code: code || RESPONSE_CODES.SUCCESS,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message: string = 'Success',
  statusCode: number = 200,
  code?: ResponseCode
): Response => {
  const response: ApiResponse<T[]> = {
    success: true,
    code: code || RESPONSE_CODES.SUCCESS,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: ResponseCode,
  errors?: any
): Response => {
  const response: any = {
    success: false,
    code: code || RESPONSE_CODES.INTERNAL_ERROR,
    message,
    timestamp: new Date().toISOString(),
    ...(errors && { errors }),
  };

  return res.status(statusCode).json(response);
};

export const getPaginationParams = (req: Request) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
};

export const calculatePaginationMeta = (
  total: number,
  page: number,
  pageSize: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / pageSize);

  return {
    total,
    page,
    pageSize,
    totalPages,
  };
};
