export interface CreateMediaDto {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  metadata?: Record<string, any>;
}

export interface UpdateMediaDto {
  filename?: string;
  alt?: string;
  title?: string;
  metadata?: Record<string, any>;
}

export interface MediaListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  mimeType?: string;
  sortBy?: 'filename' | 'size' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UploadFileDto {
  file: Express.Multer.File;
  alt?: string;
  title?: string;
  folder?: string;
}

export interface MediaFilterQuery extends MediaListQuery {
  startDate?: Date;
  endDate?: Date;
  minSize?: number;
  maxSize?: number;
}
