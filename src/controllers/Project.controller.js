"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectMembers = exports.removeProjectMember = exports.addProjectMember = exports.deleteProject = exports.updateProjectStatus = exports.updateProject = exports.getProjectById = exports.createProject = exports.getProjectStats = exports.getAllProjects = exports.getMyProjects = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const ErrorHandler_1 = require("../middleware/ErrorHandler");
// Get projects for the logged-in client
exports.getMyProjects = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const clientId = req.user?.userId;
    const projects = await prisma_1.default.project.findMany({
        where: { clientId: clientId },
        include: {
            tasks: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                    dueDate: true
                },
                take: 5,
                orderBy: { createdAt: 'desc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({
        success: true,
        count: projects.length,
        data: projects
    });
});
// Get ALL projects (for ADMIN/SUPER_ADMIN dashboard)
exports.getAllProjects = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { status, search, clientId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};
    if (status)
        where.status = status;
    if (clientId)
        where.clientId = clientId;
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { clientName: { contains: search, mode: 'insensitive' } },
            { clientEmail: { contains: search, mode: 'insensitive' } }
        ];
    }
    const [projects, total] = await Promise.all([
        prisma_1.default.project.findMany({
            where,
            select: {
                id: true,
                name: true,
                description: true,
                status: true,
                startDate: true,
                endDate: true,
                clientName: true,
                clientEmail: true,
                budget: true,
                createdAt: true,
                updatedAt: true,
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        companyName: true
                    }
                },
                _count: {
                    select: {
                        tasks: true,
                        members: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: Number(limit)
        }),
        prisma_1.default.project.count({ where })
    ]);
    res.status(200).json({
        success: true,
        count: projects.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        data: projects
    });
});
// Get project statistics for admin dashboard
exports.getProjectStats = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const [totalProjects, pendingProjects, inProgressProjects, completedProjects, cancelledProjects, totalBudget, recentProjects] = await Promise.all([
        prisma_1.default.project.count(),
        prisma_1.default.project.count({ where: { status: 'PENDING' } }),
        prisma_1.default.project.count({ where: { status: 'IN_PROGRESS' } }),
        prisma_1.default.project.count({ where: { status: 'COMPLETED' } }),
        prisma_1.default.project.count({ where: { status: 'CANCELLED' } }),
        prisma_1.default.project.aggregate({
            _sum: { budget: true }
        }),
        prisma_1.default.project.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                status: true,
                clientName: true
            }
        })
    ]);
    // Calculate average progress based on tasks
    const projectsWithTasks = await prisma_1.default.project.findMany({
        include: {
            tasks: true
        },
        take: 100
    });
    let totalProgress = 0;
    let projectsWithProgress = 0;
    projectsWithTasks.forEach(project => {
        if (project.tasks.length > 0) {
            const completedTasks = project.tasks.filter(task => task.status === 'DONE').length;
            const progress = (completedTasks / project.tasks.length) * 100;
            totalProgress += progress;
            projectsWithProgress++;
        }
    });
    const avgProgress = projectsWithProgress > 0 ? totalProgress / projectsWithProgress : 0;
    res.status(200).json({
        success: true,
        data: {
            totalProjects,
            pendingProjects,
            inProgressProjects,
            completedProjects,
            cancelledProjects,
            totalBudget: totalBudget._sum.budget || 0,
            avgProgress: Math.round(avgProgress),
            recentProjects
        }
    });
});
// Create a new project
exports.createProject = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const currentUser = req.user;
    const { name, description, clientId, clientName, clientEmail, startDate, endDate, budget, status } = req.body;
    // Validate required fields
    if (!name || !clientId) {
        throw new ErrorHandler_1.AppError('Project name and client are required', 400);
    }
    // Check if client exists
    const client = await prisma_1.default.user.findUnique({
        where: { id: clientId, role: 'CLIENT' }
    });
    if (!client) {
        throw new ErrorHandler_1.AppError('Client not found or invalid', 404);
    }
    // Use client name and email from user if not provided
    const finalClientName = clientName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email;
    const finalClientEmail = clientEmail || client.email;
    const project = await prisma_1.default.project.create({
        data: {
            name,
            description,
            clientId,
            clientName: finalClientName,
            clientEmail: finalClientEmail,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            budget: budget ? parseFloat(budget) : null,
            status: status || 'PENDING'
        },
        include: {
            client: {
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
            type: 'PROJECT_CREATED',
            performedById: currentUser.userId,
            targetId: project.id,
            targetType: 'project',
            details: { projectName: project.name }
        }
    });
    // Create notification for client
    await prisma_1.default.notification.create({
        data: {
            userId: clientId,
            title: 'New Project Created',
            message: `A new project "${project.name}" has been created for you.`,
            type: 'project_update'
        }
    });
    res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project
    });
});
// Get project by ID
exports.getProjectById = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;
    const project = await prisma_1.default.project.findUnique({
        where: { id },
        include: {
            client: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    companyName: true
                }
            },
            tasks: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    priority: true,
                    dueDate: true,
                    assignee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
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
            }
        }
    });
    if (!project) {
        throw new ErrorHandler_1.AppError('Project not found', 404);
    }
    // Check authorization
    if (currentUser.role === 'CLIENT' && project.clientId !== currentUser.userId) {
        throw new ErrorHandler_1.AppError('Not authorized to access this project', 403);
    }
    // Get recent activity for this project
    const activityLogs = await prisma_1.default.activityLog.findMany({
        where: {
            OR: [
                { targetId: id, targetType: 'project' },
                { targetId: { in: project.tasks.map(task => task.id) }, targetType: 'task' }
            ]
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
            performer: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });
    res.status(200).json({
        success: true,
        data: {
            ...project,
            activityLogs
        }
    });
});
// Update project
exports.updateProject = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;
    const updateData = req.body;
    const project = await prisma_1.default.project.findUnique({ where: { id } });
    if (!project) {
        throw new ErrorHandler_1.AppError('Project not found', 404);
    }
    // Check authorization
    if (currentUser.role === 'CLIENT' && project.clientId !== currentUser.userId) {
        throw new ErrorHandler_1.AppError('Not authorized to update this project', 403);
    }
    // If changing client, verify new client exists
    if (updateData.clientId) {
        const client = await prisma_1.default.user.findUnique({
            where: { id: updateData.clientId, role: 'CLIENT' }
        });
        if (!client) {
            throw new ErrorHandler_1.AppError('Client not found or invalid', 404);
        }
        // Update client name and email
        updateData.clientName = updateData.clientName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email;
        updateData.clientEmail = updateData.clientEmail || client.email;
    }
    // Convert dates if present
    if (updateData.startDate)
        updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate)
        updateData.endDate = new Date(updateData.endDate);
    if (updateData.budget)
        updateData.budget = parseFloat(updateData.budget);
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    const updatedProject = await prisma_1.default.project.update({
        where: { id },
        data: updateData,
        include: {
            client: {
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
            performedById: currentUser.userId,
            targetId: id,
            targetType: 'project',
            details: { updates: Object.keys(updateData) }
        }
    });
    res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: updatedProject
    });
});
// Update project status
exports.updateProjectStatus = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const currentUser = req.user;
    if (!status || !['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED'].includes(status)) {
        throw new ErrorHandler_1.AppError('Valid status is required', 400);
    }
    const project = await prisma_1.default.project.findUnique({ where: { id } });
    if (!project) {
        throw new ErrorHandler_1.AppError('Project not found', 404);
    }
    // Check authorization
    if (currentUser.role === 'CLIENT' && project.clientId !== currentUser.userId) {
        throw new ErrorHandler_1.AppError('Not authorized to update project status', 403);
    }
    const updatedProject = await prisma_1.default.project.update({
        where: { id },
        data: { status }
    });
    // Create activity log
    await prisma_1.default.activityLog.create({
        data: {
            type: 'PROJECT_UPDATED',
            performedById: currentUser.userId,
            targetId: id,
            targetType: 'project',
            details: {
                oldStatus: project.status,
                newStatus: status,
                projectName: project.name
            }
        }
    });
    // Create notification for client
    await prisma_1.default.notification.create({
        data: {
            userId: project.clientId,
            title: 'Project Status Updated',
            message: `Project "${project.name}" status changed to ${status}.`,
            type: 'project_update'
        }
    });
    res.status(200).json({
        success: true,
        message: `Project status updated to ${status}`,
        data: updatedProject
    });
});
// Delete project (SUPER_ADMIN only)
exports.deleteProject = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;
    const project = await prisma_1.default.project.findUnique({
        where: { id },
        include: {
            tasks: true,
            members: true
        }
    });
    if (!project) {
        throw new ErrorHandler_1.AppError('Project not found', 404);
    }
    // Check if project has tasks
    if (project.tasks && project.tasks.length > 0) {
        throw new ErrorHandler_1.AppError(`Cannot delete project with ${project.tasks.length} active task(s). Delete tasks first.`, 400);
    }
    await prisma_1.default.$transaction(async (tx) => {
        // Delete project members
        if (project.members && project.members.length > 0) {
            await tx.projectMember.deleteMany({ where: { projectId: id } });
        }
        // Delete activity logs related to this project
        await tx.activityLog.deleteMany({ where: { targetId: id, targetType: 'project' } });
        // Delete the project
        await tx.project.delete({ where: { id } });
    });
    // Create activity log
    await prisma_1.default.activityLog.create({
        data: {
            type: 'PROJECT_DELETED',
            performedById: currentUser.userId,
            targetId: id,
            targetType: 'project',
            details: { projectName: project.name }
        }
    });
    res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
    });
});
// Add member to project
exports.addProjectMember = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { userId, role = 'Developer' } = req.body;
    const currentUser = req.user;
    if (!userId) {
        throw new ErrorHandler_1.AppError('User ID is required', 400);
    }
    const project = await prisma_1.default.project.findUnique({ where: { id } });
    if (!project) {
        throw new ErrorHandler_1.AppError('Project not found', 404);
    }
    // Check if user exists and is not a client (clients are automatically members via clientId)
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user || user.role === 'CLIENT') {
        throw new ErrorHandler_1.AppError('User not found or cannot be added as member', 404);
    }
    // Check if user is already a member
    const existingMember = await prisma_1.default.projectMember.findFirst({
        where: { projectId: id, userId }
    });
    if (existingMember) {
        throw new ErrorHandler_1.AppError('User is already a member of this project', 400);
    }
    const member = await prisma_1.default.projectMember.create({
        data: {
            projectId: id,
            userId,
            role
        },
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
    });
    // Create activity log
    await prisma_1.default.activityLog.create({
        data: {
            type: 'USER_UPDATED', // We'll use this as a general activity type
            performedById: currentUser.userId,
            targetId: id,
            targetType: 'project',
            details: {
                action: 'member_added',
                memberId: userId,
                memberName: `${user.firstName} ${user.lastName}`,
                role
            }
        }
    });
    // Create notification for the new member
    await prisma_1.default.notification.create({
        data: {
            userId: userId,
            title: 'Added to Project',
            message: `You have been added to project "${project.name}" as a ${role}.`,
            type: 'project_update'
        }
    });
    res.status(201).json({
        success: true,
        message: 'Member added to project',
        data: member
    });
});
// Remove member from project
exports.removeProjectMember = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id, memberId } = req.params;
    const currentUser = req.user;
    const project = await prisma_1.default.project.findUnique({ where: { id } });
    if (!project) {
        throw new ErrorHandler_1.AppError('Project not found', 404);
    }
    // Check if member exists
    const member = await prisma_1.default.projectMember.findFirst({
        where: { projectId: id, userId: memberId }
    });
    if (!member) {
        throw new ErrorHandler_1.AppError('Member not found in project', 404);
    }
    await prisma_1.default.projectMember.delete({
        where: { id: member.id }
    });
    // Create activity log
    await prisma_1.default.activityLog.create({
        data: {
            type: 'USER_UPDATED',
            performedById: currentUser.userId,
            targetId: id,
            targetType: 'project',
            details: {
                action: 'member_removed',
                memberId: memberId
            }
        }
    });
    // Create notification for the removed member
    await prisma_1.default.notification.create({
        data: {
            userId: memberId,
            title: 'Removed from Project',
            message: `You have been removed from project "${project.name}".`,
            type: 'project_update'
        }
    });
    res.status(200).json({
        success: true,
        message: 'Member removed from project'
    });
});
// Get project members
exports.getProjectMembers = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const project = await prisma_1.default.project.findUnique({ where: { id } });
    if (!project) {
        throw new ErrorHandler_1.AppError('Project not found', 404);
    }
    const members = await prisma_1.default.projectMember.findMany({
        where: { projectId: id },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    avatar: true
                }
            }
        },
        orderBy: { joinedAt: 'desc' }
    });
    // Include the client as a member
    const client = await prisma_1.default.user.findUnique({
        where: { id: project.clientId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true
        }
    });
    const allMembers = [
        {
            id: project.clientId,
            projectId: id,
            userId: project.clientId,
            role: 'Client',
            joinedAt: project.createdAt,
            user: client
        },
        ...members
    ];
    res.status(200).json({
        success: true,
        count: allMembers.length,
        data: allMembers
    });
});
