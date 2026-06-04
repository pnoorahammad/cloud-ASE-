import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import csurf from 'csurf';
import authRoutes from './routes/authRoutes';
import validationRuleRoutes from './routes/validationRuleRoutes';
import deployRoutes from './routes/deployRoutes';
import { getCurrentUser, getCurrentOrg } from './controllers/authController';
import { getDeploymentStatus } from './controllers/deployController';
import { authenticateToken, requireSalesforce } from './middleware/auth';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();

// Trust reverse proxy in production (Render, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Enable CORS for frontend only (comma-separated origins supported)
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const corsOrigins = frontendUrl.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins, credentials: true }));

// Rate limiting
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

// Parsing
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('combined'));

// Request Logger Middleware (additional application logging)
app.use((req, res, next) => { logger.info(`${req.method} ${req.path}`); next(); });

// Auth Routes (login, callback) — must be before CSRF (OAuth redirects cannot send CSRF tokens)
app.use('/auth', authRoutes);

// CSRF protection for API routes (skip OAuth and health)
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
});
app.use((req, res, next) => {
  if (req.path.startsWith('/auth') || req.path === '/health') {
    return next();
  }
  return csrfProtection(req, res, next);
});

// CSRF token endpoint (frontend can fetch token and send in X-CSRF-Token header)
app.get('/csrf-token', (req, res) => {
  try {
    return res.json({ csrfToken: (req as any).csrfToken() })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate CSRF token' })
  }
});

// Validation Rules Routes
app.use('/validation-rules', validationRuleRoutes);

// Deploy Routes (staged deploy and historical audits)
app.use('/deploy', deployRoutes);

// Top-Level Required API endpoints
app.get('/user', authenticateToken as any, getCurrentUser as any);
app.get('/org', authenticateToken as any, getCurrentOrg as any);
app.get('/deployment-status', authenticateToken as any, requireSalesforce as any, getDeploymentStatus as any);

// Root test endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    timestamp: new Date().toISOString(),
    simulationMode: process.env.SF_SIMULATION_MODE === 'true'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF validation failed', { path: req.path, method: req.method });
    return res.status(403).json({ error: 'Invalid CSRF token. Refresh the page and try again.' });
  }
  logger.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;
