"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addProjectTimeLog = exports.getProjectTimeLogs = exports.addProjectComment = exports.getProjectComments = exports.getClientStats = exports.createProject = exports.getProjectDetails = exports.getClientProjects = exports.updateClientRole = exports.getClientDetails = exports.getAllClients = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const ErrorHandler_1 = require("../middleware/ErrorHandler");
// GET /api/clients - Get all clients (Admin/Manager only)
exports.getAllClients = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { search, industry } = req.query;
    const where = {
        role: 'CLIENT'
    };
    if (search) {
        where.OR = [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } }
        ];
    }
    if (industry) {
        where.industry = industry;
    }
    const clients = await prisma_1.default.user.findMany({
        where,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true,
            industry: true,
            position: true,
            isActive: true,
            createdAt: true,
            memberships: {
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                            status: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    res.status(200).json({
        success: true,
        count: clients.length,
        data: clients
    });
});
// GET /api/clients/:id - Get client details
exports.getClientDetails = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const client = await prisma_1.default.user.findFirst({
        where: {
            id,
            role: 'CLIENT'
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true,
            industry: true,
            position: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            memberships: {
                include: {
                    project: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            status: true,
                            budget: true,
                            startDate: true,
                            endDate: true,
                            members: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    if (!client) {
        throw new ErrorHandler_1.AppError('Client not found', 404);
    }
    res.status(200).json({
        success: true,
        data: client
    });
});
//api/clients/:id/role - Update client role
exports.updateClientRole = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ['CLIENT', 'DEVELOPER', 'ADMIN'];
    if (!validRoles.includes(role)) {
        throw new ErrorHandler_1.AppError('Invalid role', 400);
    }
    const client = await prisma_1.default.user.update({
        where: { id },
        data: { role },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
        }
    });
    res.status(200).json({
        success: true,
        message: 'Client role updated successfully',
        data: client
    });
});
// GET /api/clients/projects - Get client's own projects (and Developer's assignments)
exports.getClientProjects = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { status } = req.query;
    // Build OR conditions array
    const orConditions = [
        { clientId: userId } // Access if logged in user is the project owner
    ];
    // Expand access condition for DEVELOPER role to include assigned projects
    if (userRole === 'DEVELOPER') {
        orConditions.push({
            members: {
                some: {
                    userId: userId // Access if logged in user is a member of the project
                }
            }
        });
    }
    const where = {
        AND: [
            { OR: orConditions }
        ]
    };
    // Apply status filter if present
    if (status) {
        where.AND.push({ status: status });
    }
    const projects = await prisma_1.default.project.findMany({
        where,
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true
                        }
                    }
                }
            },
            tasks: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    res.status(200).json({
        success: true,
        count: projects.length,
        projects
    });
});
// GET /api/clients/projects/:id - Get project details
exports.getProjectDetails = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    // Build OR conditions array with explicit typing
    const orConditions = [
        { clientId: userId } // Client (Owner) access
    ];
    // Allow DEVELOPER access if they are a ProjectMember
    if (userRole === 'DEVELOPER' || userRole === 'ADMIN') {
        orConditions.push({
            members: {
                some: {
                    userId: userId // Developer is a member of this project
                }
            }
        });
    }
    const project = await prisma_1.default.project.findFirst({
        where: {
            id,
            OR: orConditions
        },
        include: {
            client: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    companyName: true
                }
            },
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true
                        }
                    }
                }
            },
            tasks: {
                include: {
                    assignee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });
    if (!project) {
        throw new ErrorHandler_1.AppError('Project not found or access denied', 404);
    }
    res.status(200).json({
        success: true,
        data: project
    });
});
// POST /api/clients/projects - Create new project
exports.createProject = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const clientId = req.user?.id;
    const { name, description, budget, startDate, endDate } = req.body;
    if (!name) {
        throw new ErrorHandler_1.AppError('Project name is required', 400);
    }
    // Get client info
    const client = await prisma_1.default.user.findUnique({
        where: { id: clientId },
        select: {
            firstName: true,
            lastName: true,
            email: true,
            companyName: true
        }
    });
    if (!client) {
        throw new ErrorHandler_1.AppError('Client not found', 404);
    }
    const project = await prisma_1.default.project.create({
        data: {
            name,
            description,
            budget,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            clientName: client.companyName || `${client.firstName} ${client.lastName}`,
            clientEmail: client.email,
            clientId: clientId,
            members: {
                create: {
                    userId: clientId,
                    // Ensures role consistency with the UserRole enum
                    role: 'CLIENT'
                }
            }
        },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            }
        }
    });
    res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project
    });
});
// GET /api/clients/stats - Client statistics
exports.getClientStats = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const clientId = req.user?.id;
    const projects = await prisma_1.default.project.findMany({
        where: {
            clientId: clientId
        },
        include: {
            tasks: true,
            members: true
        }
    });
    const stats = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
        completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
        totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
        totalTasks: projects.reduce((sum, p) => sum + p.tasks.length, 0),
        completedTasks: projects.reduce((sum, p) => sum + p.tasks.filter(t => t.status === 'DONE').length, 0)
    };
    res.status(200).json({
        success: true,
        data: stats
    });
});
// GET /api/clients/projects/:id/comments - Get project comments
exports.getProjectComments = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    // Verify project access
    const project = await prisma_1.default.project.findFirst({
        where: {
            id,
            OR: [
                { clientId: userId },
                {
                    members: {
                        some: {
                            userId: userId
                        }
                    }
                }
            ]
        }
    });
    if (!project) {
        throw new ErrorHandler_1.AppError('Project not found or access denied', 404);
    }
    const comments = await prisma_1.default.comment.findMany({
        where: {
            projectId: id
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({
        success: true,
        count: comments.length,
        data: comments
    });
});
// POST /api/clients/projects/:id/comments - Add project comment
exports.addProjectComment = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const { content } = req.body;
    if (!content) {
        throw new ErrorHandler_1.AppError('Comment content is required', 400);
    }
    // Verify project access
    const project = await prisma_1.default.project.findFirst({
        where: {
            id,
            OR: [
                { clientId: userId },
                {
                    members: {
                        some: {
                            userId: userId
                        }
                    }
                }
            ]
        }
    });
    if (!project) {
        throw new ErrorHandler_1.AppError('Project not found or access denied', 404);
    }
    const comment = await prisma_1.default.comment.create({
        data: {
            content,
            projectId: id,
            userId: userId
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });
    // Create activity log
    await prisma_1.default.activityLog.create({
        data: {
            type: 'PROJECT_UPDATED',
            performedById: userId,
            targetId: id,
            targetType: 'project',
            details: {
                action: 'comment_added',
                commentId: comment.id,
                projectName: project.name
            }
        }
    });
    res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment
    });
});
// GET /api/clients/projects/:id/time-logs - Get project time logs
exports.getProjectTimeLogs = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    // Verify project access
    const project = await prisma_1.default.project.findFirst({
        where: {
            id,
            OR: [
                { clientId: userId },
                {
                    members: {
                        some: {
                            userId: userId
                        }
                    }
                }
            ]
        }
    });
    if (!project) {
        throw new ErrorHandler_1.AppError('Project not found or access denied', 404);
    }
    const timeLogs = await prisma_1.default.timeLog.findMany({
        where: {
            task: {
                projectId: id
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            },
            task: {
                select: {
                    id: true,
                    title: true
                }
            }
        },
        orderBy: { date: 'desc' }
    });
    res.status(200).json({
        success: true,
        count: timeLogs.length,
        data: timeLogs
    });
});
// POST /api/clients/projects/:id/time-logs - Add project time log
exports.addProjectTimeLog = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const { hours, description, date } = req.body;
    if (!hours || !description) {
        throw new ErrorHandler_1.AppError('Hours and description are required', 400);
    }
    // Verify project access
    const project = await prisma_1.default.project.findFirst({
        where: {
            id,
            OR: [
                { clientId: userId },
                {
                    members: {
                        some: {
                            userId: userId
                        }
                    }
                }
            ]
        }
    });
    if (!project) {
        throw new ErrorHandler_1.AppError('Project not found or access denied', 404);
    }
    // Create a general project task if no specific task exists
    let task = await prisma_1.default.task.findFirst({
        where: {
            projectId: id,
            title: "General Project Work"
        }
    });
    if (!task) {
        task = await prisma_1.default.task.create({
            data: {
                title: "General Project Work",
                description: "General project activities and discussions",
                projectId: id,
                createdBy: userId,
                status: 'DONE'
            }
        });
    }
    const timeLog = await prisma_1.default.timeLog.create({
        data: {
            hours: parseFloat(hours),
            description,
            date: date ? new Date(date) : new Date(),
            taskId: task.id,
            userId: userId
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            }
        }
    });
    // Create activity log
    await prisma_1.default.activityLog.create({
        data: {
            type: 'PROJECT_UPDATED',
            performedById: userId,
            targetId: id,
            targetType: 'project',
            details: {
                action: 'time_logged',
                hours: parseFloat(hours),
                projectName: project.name
            }
        }
    });
    res.status(201).json({
        success: true,
        message: 'Time logged successfully',
        data: timeLog
    });
});
