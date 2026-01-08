import { createClient } from '@supabase/supabase-js';
import { Request } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

class SupabaseStorageService {
  private supabase;
  private bucketName: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials are not configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'csm-uploads';
  }

  // Configure multer for memory storage
  getMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
      },
      fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(',');
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} is not allowed`));
        }
      },
    });
  }

  // Upload single file
  async uploadFile(file: Express.Multer.File, folder: string = ''): Promise<{ url: string; path: string }> {
    try {
      const fileExt = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath,
      };
    } catch (error) {
      throw error;
    }
  }

  // Upload multiple files
  async uploadFiles(files: Express.Multer.File[], folder: string = ''): Promise<Array<{ url: string; path: string }>> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return await Promise.all(uploadPromises);
  }

  // Delete file
  async deleteFile(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  // Delete multiple files
  async deleteFiles(filePaths: string[]): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove(filePaths);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  // Get public URL
  getPublicUrl(filePath: string): string {
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // List files in folder
  async listFiles(folder: string = '') {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .list(folder);

    if (error) {
      throw new Error(`List failed: ${error.message}`);
    }

    return data;
  }
}

export default new SupabaseStorageService();
