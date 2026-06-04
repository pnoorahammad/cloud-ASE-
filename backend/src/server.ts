import app from './app';
import { connectDB } from './config/db';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    logger.info('Initializing Salesforce Validation Rule Manager backend...');
    
    // Connect to database (Optional: fallback to JSON store happens gracefully inside connectDB)
    await connectDB();

    // Start server listener
    app.listen(PORT, () => {
      logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      if (process.env.SF_SIMULATION_MODE === 'true') {
        logger.warn('WARNING: Running in SIMULATION MODE. Salesforce API requests will be mocked.');
      } else {
        logger.info('Running in PRODUCTION MODE. Salesforce API calls will execute via JSForce.');
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
