import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    logger.warn('MONGO_URI is not defined in environment variables. Audit logs will be stored locally in JSON format.');
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('Successfully connected to MongoDB.');
    return true;
  } catch (error) {
    logger.error('Failed to connect to MongoDB, falling back to local JSON logging:', error);
    return false;
  }
};
