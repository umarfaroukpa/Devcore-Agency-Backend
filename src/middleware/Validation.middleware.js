"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
exports.validate = validate;
// Common validation schemas
exports.schemas = {
    register: zod_1.z.object({
        body: zod_1.z.object({
            email: zod_1.z.string().email('Invalid email format'),
            password: zod_1.z.string()
                .min(8, 'Password must be at least 8 characters')
                .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
                .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
                .regex(/[0-9]/, 'Password must contain at least one number'),
            firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters'),
            lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters'),
        }),
    }),
    login: zod_1.z.object({
        body: zod_1.z.object({
            email: zod_1.z.string().email('Invalid email format'),
            password: zod_1.z.string().min(1, 'Password is required'),
        }),
    }),
    createProject: zod_1.z.object({
        body: zod_1.z.object({
            name: zod_1.z.string().min(3, 'Project name must be at least 3 characters'),
            description: zod_1.z.string().optional(),
            clientName: zod_1.z.string().min(2, 'Client name is required'),
            clientEmail: zod_1.z.string().email('Invalid client email'),
            budget: zod_1.z.number().positive().optional(),
            startDate: zod_1.z.string().datetime().optional(),
            endDate: zod_1.z.string().datetime().optional(),
        }),
    }),
    createTask: zod_1.z.object({
        body: zod_1.z.object({
            title: zod_1.z.string().min(3, 'Task title must be at least 3 characters'),
            description: zod_1.z.string().optional(),
            projectId: zod_1.z.string().uuid('Invalid project ID'),
            assignedTo: zod_1.z.string().uuid('Invalid user ID').optional(),
            priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
            dueDate: zod_1.z.string().datetime().optional(),
        }),
    }),
    updateUser: zod_1.z.object({
        body: zod_1.z.object({
            firstName: zod_1.z.string().min(2).optional(),
            lastName: zod_1.z.string().min(2).optional(),
            email: zod_1.z.string().email().optional(),
            role: zod_1.z.enum(['ADMIN', 'DEVELOPER', 'CLIENT']).optional(),
            isActive: zod_1.z.boolean().optional(),
        }),
    }),
};
