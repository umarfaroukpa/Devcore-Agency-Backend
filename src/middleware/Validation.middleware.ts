import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
export const schemas = {
  register: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
      firstName: z.string().min(2, 'First name must be at least 2 characters'),
      lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required'),
    }),
  }),

  createProject: z.object({
    body: z.object({
      name: z.string().min(3, 'Project name must be at least 3 characters'),
      description: z.string().optional(),
      clientName: z.string().min(2, 'Client name is required'),
      clientEmail: z.string().email('Invalid client email'),
      budget: z.number().positive().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    }),
  }),

  createTask: z.object({
    body: z.object({
      title: z.string().min(3, 'Task title must be at least 3 characters'),
      description: z.string().optional(),
      projectId: z.string().uuid('Invalid project ID'),
      assignedTo: z.string().uuid('Invalid user ID').optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
      dueDate: z.string().datetime().optional(),
    }),
  }),

  updateUser: z.object({
    body: z.object({
      firstName: z.string().min(2).optional(),
      lastName: z.string().min(2).optional(),
      email: z.string().email().optional(),
      role: z.enum(['ADMIN', 'DEVELOPER', 'CLIENT']).optional(),
      isActive: z.boolean().optional(),
    }),
  }),
};