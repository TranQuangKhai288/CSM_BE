import { PrismaClient } from '@prisma/client';

class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
      errorFormat: 'minimal',
      // Connection pool optimization for free tier (Render has limited connections)
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');

    // Log connection pool info in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 Database connection established');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Database disconnected');
  }

  async enableShutdownHooks() {
    process.on('beforeExit', async () => {
      await this.$disconnect();
    });
  }
}

export default new PrismaService();
