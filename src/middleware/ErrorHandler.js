"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.asyncHandler = exports.errorHandler = exports.AppError = void 0;
const client_1 = require("@prisma/client");
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let details = undefined;
    // Custom AppError
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    // Prisma Errors
    else if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        statusCode = 400;
        switch (err.code) {
            case 'P2002':
                message = 'Duplicate entry. Record already exists.';
                details = { field: err.meta?.target };
                break;
            case 'P2025':
                message = 'Record not found';
                statusCode = 404;
                break;
            case 'P2003':
                message = 'Foreign key constraint failed';
                break;
            case 'P2014':
                message = 'Invalid ID provided';
                break;
            default:
                message = 'Database error occurred';
                details = { code: err.code };
        }
    }
    // Prisma Validation Error
    else if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        statusCode = 400;
        message = 'Invalid data provided';
    }
    // JWT Errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    // Validation Errors (if using express-validator or similar)
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
        details = err.message;
    }
    // Log error for debugging
    console.error('❌ Error:', {
        message: err.message,
        statusCode,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
    });
    // Send response
    const response = {
        error: message,
        ...(details && { details }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
// Async handler wrapper to catch async errors
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// 404 Not Found Handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
    });
};
exports.notFoundHandler = notFoundHandler;
