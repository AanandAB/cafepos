import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Global error handler for better error responses
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.details || err.message
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      message: 'Resource already exists',
      error: 'Duplicate entry'
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({
      message: 'Invalid reference',
      error: 'Referenced resource does not exist'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Input validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: 'Invalid request data',
          errors: result.error.format()
        });
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// ID parameter validation
export const validateIdParam = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid ID parameter' });
  }
  req.params.id = id.toString();
  next();
};

// File upload validation and security
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const file = req.file;
  const allowedTypes = ['text/csv', 'application/json'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({
      message: 'Invalid file type',
      allowed: allowedTypes
    });
  }

  // Check file size
  if (file.size > maxSize) {
    return res.status(400).json({
      message: 'File too large',
      maxSize: '5MB'
    });
  }

  // Sanitize filename
  const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  file.originalname = sanitizedFilename;

  next();
};

// Rate limiting for sensitive endpoints
const rateLimitStore = new Map();

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }

    const requests = rateLimitStore.get(key).filter((time: number) => time > windowStart);
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        message: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    requests.push(now);
    rateLimitStore.set(key, requests);
    next();
  };
};