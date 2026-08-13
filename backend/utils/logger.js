import winston from 'winston';
import { config } from '../config/env.js';

const logger = winston.createLogger({
  level: config.debug ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export default logger;
