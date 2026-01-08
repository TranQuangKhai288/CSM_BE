import { Request, Response, NextFunction } from 'express';
import mediaService from './media.service';
import { successResponse, paginatedResponse } from '@common/utils/response';
import { MESSAGES, HTTP_STATUS } from '@common/constants';
import { RESPONSE_CODES } from '@common/constants/response-codes';
import { BadRequestError } from '@common/utils/errors';

class MediaController {
  /**
   * @swagger
   * /admin/media/upload:
   *   post:
   *     tags: [Media]
   *     summary: Upload a file
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *               alt:
   *                 type: string
   *               title:
   *                 type: string
   *               folder:
   *                 type: string
   *     responses:
   *       201:
   *         description: File uploaded successfully
   */
  async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError('No file provided', RESPONSE_CODES.MEDIA_NO_FILE);
      }

      const { alt, title, folder } = req.body;
      const media = await mediaService.uploadFile(req.file, folder, alt, title);

      return successResponse(res, media, 'File uploaded successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/media/upload-multiple:
   *   post:
   *     tags: [Media]
   *     summary: Upload multiple files
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               files:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *               folder:
   *                 type: string
   *     responses:
   *       201:
   *         description: Files uploaded successfully
   */
  async uploadFiles(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new BadRequestError('No files provided', RESPONSE_CODES.MEDIA_NO_FILE);
      }

      const { folder } = req.body;
      const media = await mediaService.uploadFiles(req.files, folder);

      return successResponse(res, media, 'Files uploaded successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/media:
   *   get:
   *     tags: [Media]
   *     summary: Get all media with pagination and filtering
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *       - in: query
   *         name: mimeType
   *         schema:
   *           type: string
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [filename, size, createdAt]
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *     responses:
   *       200:
   *         description: Media retrieved successfully
   */
  async getMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await mediaService.getMedia(req.query);
      return paginatedResponse(res, result.data, result.meta, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/media/stats:
   *   get:
   *     tags: [Media]
   *     summary: Get media statistics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   */
  async getMediaStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await mediaService.getMediaStats();
      return successResponse(res, stats, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/media/{id}:
   *   get:
   *     tags: [Media]
   *     summary: Get media by ID
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Media retrieved successfully
   */
  async getMediaById(req: Request, res: Response, next: NextFunction) {
    try {
      const media = await mediaService.getMediaById(req.params.id);
      return successResponse(res, media, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/media/{id}/signed-url:
   *   get:
   *     tags: [Media]
   *     summary: Get signed URL for private media
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: expiresIn
   *         schema:
   *           type: integer
   *           default: 3600
   *     responses:
   *       200:
   *         description: Signed URL generated successfully
   */
  async getSignedUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const expiresIn = parseInt(req.query.expiresIn as string) || 3600;
      const result = await mediaService.getSignedUrl(req.params.id, expiresIn);
      return successResponse(res, result, MESSAGES.SUCCESS);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/media/{id}:
   *   patch:
   *     tags: [Media]
   *     summary: Update media
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               filename:
   *                 type: string
   *               alt:
   *                 type: string
   *               title:
   *                 type: string
   *               metadata:
   *                 type: object
   *     responses:
   *       200:
   *         description: Media updated successfully
   */
  async updateMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const media = await mediaService.updateMedia(req.params.id, req.body);
      return successResponse(res, media, 'Media updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/media/{id}:
   *   delete:
   *     tags: [Media]
   *     summary: Delete media
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Media deleted successfully
   */
  async deleteMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await mediaService.deleteMedia(req.params.id);
      return successResponse(res, result, 'Media deleted successfully');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/media/bulk-delete:
   *   post:
   *     tags: [Media]
   *     summary: Delete multiple media items
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               ids:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Media items deleted successfully
   */
  async deleteMediaBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new BadRequestError('No media IDs provided', RESPONSE_CODES.VALIDATION_ERROR);
      }

      const result = await mediaService.deleteMediaBulk(ids);
      return successResponse(res, result, 'Media items deleted successfully');
    } catch (error) {
      return next(error);
    }
  }
}

export default new MediaController();
