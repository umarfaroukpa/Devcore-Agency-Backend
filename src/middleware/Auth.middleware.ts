import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

// Extend the Request object to include user data
interface AuthRequest extends Request {
    userId?: string;
    userRole?: string;
}

// 1. JWT Authentication Middleware
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Bearer TOKEN)
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string, role: string };

            // Attach user data to the request object
            req.userId = decoded.id;
            req.userRole = decoded.role;

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ error: 'Not authorized, token failed.' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token.' });
    }
};

// 2. Role-Based Access Control (RBAC) Middleware
export const restrictTo = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            return res.status(403).json({ 
                error: 'Not authorized to perform this action.',
                requiredRoles: roles
            });
        }
        next();
    };
};