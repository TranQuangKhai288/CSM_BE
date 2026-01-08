import { PrismaClient } from '@prisma/client';

class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: ['error', 'warn'],
      errorFormat: 'minimal',
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
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
