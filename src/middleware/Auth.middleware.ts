import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma'; 

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const restrictTo = (roles: string[]) => { 
    return (req: AuthRequest, res: Response, next: NextFunction) => { 
        console.log('🔒 Checking role access...');
        console.log('   Required roles:', roles);
        console.log('   User role:', req.user?.role);
        console.log('   User object:', req.user);
        
        // here to ensure the user is authenticated and the user object exists
        if (!req.user) {
            console.log('❌ No user object on request');
            return res.status(403).json({ 
                error: 'Access denied. User not authenticated.',
                requiredRoles: roles 
            });
        }
        
        if (!roles.includes(req.user.role)) {
            console.log('❌ User role not in allowed roles');
            return res.status(403).json({ 
                error: 'Access denied. Insufficient permissions.',
                requiredRoles: roles,
                userRole: req.user.role
            });
        }
        
        console.log('✅ Role check passed');
        next();
    };
};