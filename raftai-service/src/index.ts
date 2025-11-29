import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { authMiddleware } from './mw/auth.js';
import { idempotencyMiddleware } from './mw/idem.js';

// Routes
import { healthzRouter } from './routes/healthz.js';
import { processKycRouter } from './routes/processKYC.js';
import { processKybRouter } from './routes/processKYB.js';
import { analyzePitchRouter } from './routes/analyzePitch.js';
import { chatRouter } from './routes/chat.js';
import { scoresRouter } from './routes/scores.js';
import { complianceRouter } from './routes/compliance.js';
import { idoRouter } from './routes/ido.js';
import { financeRouter } from './routes/finance.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://cryptorafts.com', 'https://www.cryptorafts.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check (no auth required)
app.use('/healthz', healthzRouter);

// Auth middleware for all other routes
app.use(authMiddleware);

// Idempotency middleware for state-changing operations
app.use('/processKYC', idempotencyMiddleware);
app.use('/processKYB', idempotencyMiddleware);
app.use('/analyzePitch', idempotencyMiddleware);

// API routes
app.use('/processKYC', processKycRouter);
app.use('/processKYB', processKybRouter);
app.use('/analyzePitch', analyzePitchRouter);
app.use('/chat', chatRouter);
app.use('/scores', scoresRouter);
app.use('/compliance', complianceRouter);
app.use('/ido', idoRouter);
app.use('/finance', financeRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    code: err.code || 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`RaftAI service listening on port ${PORT}`, {
    nodeEnv: process.env.NODE_ENV,
    mockMode: process.env.MOCK_MODE === 'true'
  });
});

export default app;
