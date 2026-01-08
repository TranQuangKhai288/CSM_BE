import prismaService from '@core/database/prisma.service';
import supabaseStorageService from '@core/storage/supabase-storage.service';
import { CreateMediaDto, UpdateMediaDto, MediaListQuery, MediaFilterQuery } from './dto/media.dto';
import { NotFoundError, BadRequestError } from '@common/utils/errors';
import { RESPONSE_CODES } from '@common/constants/response-codes';
import eventEmitter, { AppEvents } from '@core/events/event-emitter.service';

class MediaService {
  // Upload file to storage
  async uploadFile(file: Express.Multer.File, folder?: string, alt?: string, title?: string) {
    try {
      // Upload to Supabase Storage
      const uploadResult = await supabaseStorageService.uploadFile(file, folder || 'uploads');

      // Create media record in database
      const media = await prismaService.media.create({
        data: {
          filename: file.originalname,
          url: uploadResult.url,
          mimeType: file.mimetype,
          size: file.size,
          alt: alt || file.originalname,
          title: title || file.originalname,
          metadata: {
            path: uploadResult.path,
            originalName: file.originalname,
          },
        },
      });

      eventEmitter.emit(AppEvents.MEDIA_UPLOADED, { mediaId: media.id });

      return media;
    } catch (error: any) {
      throw new BadRequestError(
        `Failed to upload file: ${error.message}`,
        RESPONSE_CODES.MEDIA_UPLOAD_FAILED
      );
    }
  }

  // Upload multiple files
  async uploadFiles(
    files: Express.Multer.File[],
    folder?: string,
    alts?: string[],
    titles?: string[]
  ) {
    const uploadPromises = files.map((file, index) =>
      this.uploadFile(file, folder, alts?.[index], titles?.[index])
    );

    return await Promise.all(uploadPromises);
  }

  // Get all media with pagination
  async getMedia(query: MediaFilterQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const where: any = {};

    if (query.search) {
      where.OR = [
        { filename: { contains: query.search, mode: 'insensitive' } },
        { alt: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.mimeType) {
      where.mimeType = { contains: query.mimeType, mode: 'insensitive' };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    if (query.minSize !== undefined || query.maxSize !== undefined) {
      where.size = {};
      if (query.minSize !== undefined) {
        where.size.gte = query.minSize;
      }
      if (query.maxSize !== undefined) {
        where.size.lte = query.maxSize;
      }
    }

    const [media, total] = await Promise.all([
      prismaService.media.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      prismaService.media.count({ where }),
    ]);

    return {
      data: media,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // Get media by ID
  async getMediaById(id: string) {
    const media = await prismaService.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundError('Media not found', RESPONSE_CODES.MEDIA_NOT_FOUND);
    }

    return media;
  }

  // Update media
  async updateMedia(id: string, data: UpdateMediaDto) {
    const media = await this.getMediaById(id);

    const updated = await prismaService.media.update({
      where: { id },
      data,
    });

    eventEmitter.emit(AppEvents.MEDIA_UPDATED, { mediaId: id });

    return updated;
  }

  // Delete media
  async deleteMedia(id: string) {
    const media = await this.getMediaById(id);

    // Delete from storage
    if (media.metadata && typeof media.metadata === 'object') {
      const metadata = media.metadata as any;
      if (metadata.path) {
        try {
          await supabaseStorageService.deleteFile(metadata.path);
        } catch (error) {
          // Log error but continue with database deletion
          console.error('Failed to delete file from storage:', error);
        }
      }
    }

    // Delete from database
    await prismaService.media.delete({
      where: { id },
    });

    eventEmitter.emit(AppEvents.MEDIA_DELETED, { mediaId: id });

    return { message: 'Media deleted successfully' };
  }

  // Delete multiple media
  async deleteMediaBulk(ids: string[]) {
    const deletePromises = ids.map((id) => this.deleteMedia(id));
    await Promise.all(deletePromises);

    return { message: `${ids.length} media items deleted successfully` };
  }

  // Get media statistics
  async getMediaStats() {
    const [total, totalSize, byMimeType] = await Promise.all([
      prismaService.media.count(),
      prismaService.media.aggregate({
        _sum: {
          size: true,
        },
      }),
      prismaService.media.groupBy({
        by: ['mimeType'],
        _count: {
          id: true,
        },
        _sum: {
          size: true,
        },
      }),
    ]);

    return {
      total,
      totalSize: totalSize._sum.size || 0,
      byMimeType: byMimeType.map((item) => ({
        mimeType: item.mimeType,
        count: item._count.id,
        size: item._sum.size || 0,
      })),
    };
  }

  // Get public URL for media
  async getSignedUrl(id: string, expiresIn: number = 3600) {
    const media = await this.getMediaById(id);

    if (media.metadata && typeof media.metadata === 'object') {
      const metadata = media.metadata as any;
      if (metadata.path) {
        const publicUrl = supabaseStorageService.getPublicUrl(metadata.path);
        return { url: publicUrl };
      }
    }

    return { url: media.url };
  }
}

export default new MediaService();
