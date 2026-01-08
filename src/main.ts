import 'dotenv/config';
import './moduleAlias';
import App from './app';
import logger from './common/utils/logger';

const startServer = async () => {
  try {
    const app = new App();
    await app.listen();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
