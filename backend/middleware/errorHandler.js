import logger from '../utils/logger.js';

export class APIError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class ValidationError extends APIError {
  constructor(message) {
    super(message, 400);
  }
}

export const errorHandler = (err, req, res, next) => {
  logger.error(err.message);
  
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      detail: err.message
    });
  }

  res.status(500).json({
    success: false,
    detail: err.message || 'Internal Server Error'
  });
};
