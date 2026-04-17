import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';

const start = async () => {
  try {
    await connectDB();
    app.listen(env.PORT, () => {
      logger.info(`API running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

start();
