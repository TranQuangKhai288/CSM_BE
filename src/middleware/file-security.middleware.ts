import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import logger from '@common/utils/logger';
import { BadRequestError } from '@common/utils/errors';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_ALL_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validate file type
 */
export function validateFileType(file: Express.Multer.File, allowedTypes: string[]): boolean {
  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    return false;
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = allowedTypes.map((type) => {
    const parts = type.split('/');
    return `.${parts[1]}`;
  });

  // Handle special cases
  if (file.mimetype === 'image/jpeg' && !['.jpg', '.jpeg'].includes(ext)) {
    return false;
  }

  return true;
}

/**
 * Validate file size
 */
export function validateFileSize(
  file: Express.Multer.File,
  maxSize: number = MAX_FILE_SIZE
): boolean {
  return file.size <= maxSize;
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');

  // Replace spaces and special characters
  sanitized = sanitized
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();

  // Ensure filename is not empty
  if (!sanitized) {
    sanitized = `file_${Date.now()}`;
  }

  return sanitized;
}

/**
 * File upload middleware with validation
 */
export const fileUploadMiddleware = (options?: {
  allowedTypes?: string[];
  maxSize?: number;
  fieldName?: string;
  maxFiles?: number;
}) => {
  const allowedTypes = options?.allowedTypes || ALLOWED_IMAGE_TYPES;
  const maxSize = options?.maxSize || MAX_FILE_SIZE;
  const fieldName = options?.fieldName || 'file';
  const maxFiles = options?.maxFiles || 1;

  return (req: Request, res: Response, next: NextFunction) => {
    // Multer already handles the file parsing via upload.single() or upload.array()
    // This is additional validation after multer has processed the files

    const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];

    if (files.length === 0) {
      return next();
    }

    try {
      // Validate each file
      for (const file of files) {
        // Validate file type
        if (!validateFileType(file, allowedTypes)) {
          throw new BadRequestError(
            `Invalid file type for ${file.originalname}. Allowed types: ${allowedTypes.join(', ')}`
          );
        }

        // Validate file size
        if (!validateFileSize(file, maxSize)) {
          throw new BadRequestError(
            `File ${file.originalname} is too large. Maximum size: ${maxSize / 1024 / 1024}MB`
          );
        }

        // Sanitize filename (if needed for local storage)
        if (file.originalname) {
          file.originalname = sanitizeFilename(file.originalname);
        }
      }

      next();
    } catch (error) {
      logger.error('File validation error:', error);
      next(error);
    }
  };
};

/**
 * Validate image file specifically
 */
export const validateImageFile = fileUploadMiddleware({
  allowedTypes: ALLOWED_IMAGE_TYPES,
  maxSize: 5 * 1024 * 1024, // 5MB
});

/**
 * Validate document file
 */
export const validateDocumentFile = fileUploadMiddleware({
  allowedTypes: ALLOWED_DOCUMENT_TYPES,
  maxSize: 10 * 1024 * 1024, // 10MB
});

/**
 * Check for potential malicious file content
 * This is a basic check - for production, consider using antivirus scanning
 */
export function checkFileContent(buffer: Buffer): boolean {
  // Check for common malicious patterns
  const content = buffer.toString('binary', 0, Math.min(buffer.length, 1024));

  // Check for PHP tags
  if (content.includes('<?php') || content.includes('<?=')) {
    return false;
  }

  // Check for executable headers
  if (content.startsWith('MZ') || content.startsWith('PK')) {
    // MZ = Windows executable, PK = ZIP/JAR (could contain executables)
    return false;
  }

  // Check for script tags in images (SVG injection)
  if (content.includes('<script')) {
    return false;
  }

  return true;
}

/**
 * Express middleware to check file content
 */
export const checkMaliciousContent = (req: Request, res: Response, next: NextFunction) => {
  const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];

  try {
    for (const file of files) {
      if (file.buffer && !checkFileContent(file.buffer)) {
        throw new BadRequestError(
          `File ${file.originalname} contains potentially malicious content`
        );
      }
    }

    next();
  } catch (error) {
    logger.error('Malicious content detection error:', error);
    next(error);
  }
};

/**
 * Complete file security middleware stack
 */
export const fileSecurityMiddleware = [validateImageFile, checkMaliciousContent];
