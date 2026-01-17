import { createClient } from 'redis';

class RedisService {
  private client;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        tls: process.env.REDIS_TLS === 'true' ? true : undefined,
      },
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB || '0'),
    });

    this.client.on('error', () => {
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
      this.isConnected = true;
    });
  }

  async connect() {
    if (this.isConnected) {
      console.log('Redis already connected.');
      return;
    }

    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    const connectTimeout = 1000; // ms

    console.log('🔄 Attempting to connect to Redis...');

    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[Redis] Try connect: ${attempt}/${maxRetries}`);

      // If client is already in an open/ready state, consider it connected
      const clientState: any = this.client;
      if (clientState && (clientState.isOpen === true || clientState.isReady === true)) {
        console.log('[Redis] client already open -> marking connected');
        this.isConnected = true;
        return;
      }

      try {
        // Use Promise.race to avoid hanging indefinitely on connect()
        await Promise.race([
          this.client.connect(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('connect_timeout')), connectTimeout)
          ),
        ]);

        console.log('[Redis] here - connect() resolved');
        return;
      } catch (error: any) {
        lastError = error;

        if (error && error.message === 'connect_timeout') {
          console.warn(
            `⚠️  Redis connection attempt ${attempt}/${maxRetries} timed out after ${connectTimeout}ms.`
          );
          // best-effort to clean up before next attempt
          try {
            await this.client.disconnect();
          } catch (e) {
            // ignore
          }
        } else {
          console.warn(
            `⚠️  Redis connection attempt ${attempt}/${maxRetries} failed. Retrying in ${retryDelay / 1000}s...`
          );
        }

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          console.warn(
            `⚠️  Redis connection failed after ${maxRetries} attempts - System running without cache`
          );
          console.warn(
            '   Last Reason:',
            lastError && lastError.message ? lastError.message : lastError
          );
          this.isConnected = false;
        }
      }
    }

    console.log('[Redis] Final isConnected:', this.isConnected);
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log('❌ Redis disconnected');
    }
  }

  // Cache methods
  async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (error) {
      // ignore
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      return (await this.client.exists(key)) === 1;
    } catch (error) {
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      // ignore
    }
  }

  async getJSON<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setJSON<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.isConnected) return;
    await this.set(key, JSON.stringify(value), ttl);
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      // ignore
    }
  }

  async clearAll(): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.flushDb();
    } catch (error) {
      // ignore
    }
  }

  getClient() {
    return this.client;
  }
}

export default new RedisService();
