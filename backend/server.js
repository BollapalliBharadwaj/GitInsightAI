import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/health.js';
import analyzeRoutes from './routes/analyze.js';
import securityRoutes from './routes/security.js';

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api', analyzeRoutes);
app.use('/api', securityRoutes);

// Error Handler
app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  app.listen(config.server.port, config.server.host, () => {
    logger.info(`Starting ${config.appName} v${config.appVersion}`);
    logger.info(`Server running on http://${config.server.host}:${config.server.port}`);
  });
};

startServer();
