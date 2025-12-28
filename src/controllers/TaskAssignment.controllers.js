"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAssignTask = exports.getAllTasks = exports.deleteTask = exports.getTaskById = exports.updateTask = exports.getMyTasks = exports.getAvailableDevelopers = exports.assignTask = exports.createTask = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const ErrorHandler_1 = require("../middleware/ErrorHandler");
// Helper to check if user can assign tasks
const canAssignTask = (user) => {
    return user.role === 'SUPER_ADMIN' ||
        user.role === 'ADMIN' && user.canAssignTasks === true;
};
exports.canAssignTask = canAssignTask;
// POST /api/tasks - Create and assign task
exports.createTask = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const currentUser = req.user;
    const { title, description, projectId, assignedTo, // Can be array for multiple assignments
    priority = 'MEDIUM', dueDate, estimatedHours } = req.body;
    // Validate required fields
    if (!title || !projectId) {
        throw new ErrorHandler_1.AppError('Title and project ID are required', 400);
    }
    // Check if project exists
    const project = await prisma_1.default.project.findUnique({
        where: { id: projectId },
        include: { members: true }
    });
    if (!project) {
        throw new ErrorHandler_1.AppError('Project not found', 404);
    }
    // Check if user has permission to create tasks for this project
    const isMember = project.members.some(m => m.userId === currentUser.userId);
    const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
    if (!isMember && !isAdmin) {
        throw new ErrorHandler_1.AppError('You do not have permission to create tasks for this project', 403);
    }
    // If assigning to someone, check permission
    if (assignedTo && !canAssignTask(currentUser)) {
        throw new ErrorHandler_1.AppError('You do not have permission to assign tasks', 403);
    }
    // Validate assignee if provided
    if (assignedTo) {
        const assignee = await prisma_1.default.user.findUnique({
            where: { id: assignedTo }
        });
        if (!assignee) {
            throw new ErrorHandler_1.AppError('Assigned user not found', 404);
        }
        // Check if assignee is project member (for non-admins)
        if (!isAdmin) {
            const isAssigneeMember = project.members.some(m => m.userId === assignedTo);
            if (!isAssigneeMember) {
                throw new ErrorHandler_1.AppError('Can only assign tasks to project members', 403);
            }
        }
    }
    // Create task
    const task = await prisma_1.default.task.create({
        data: {
            title,
            description,
            project: {
                connect: { id: projectId }
            },
            assignee: assignedTo ? { connect: { id: assignedTo } } : null,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
            estimatedHours,
            creator: {
                connect: { id: currentUser.id }
            }
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            },
            project: {
                select: {
                    id: true,
                    name: true
                }
            },
            creator: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            }
        }
    });
    // Create notification for assignee
    if (assignedTo) {
        await prisma_1.default.notification.create({
            data: {
                userId: assignedTo,
                title: 'New Task Assigned',
                message: `You have been assigned to: ${title}`,
                type: 'task_assigned',
                link: `/dashboard/tasks/${task.id}`
            }
        });
    }
    // Log activity
    await prisma_1.default.activityLog.create({
        data: {
            type: 'TASK_CREATED',
            performer: {
                connect: { id: currentUser.id }
            },
            targetId: task.id,
            targetType: 'task',
            details: {
                title,
                projectId,
                assignedTo
            }
        }
    });
    res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task
    });
});
// PATCH /api/tasks/:id/assign - Assign/reassign task
exports.assignTask = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const currentUser = req.user;
    // Check permission
    if (!canAssignTask(currentUser)) {
        throw new ErrorHandler_1.AppError('You do not have permission to assign tasks', 403);
    }
    // Get task
    const task = await prisma_1.default.task.findUnique({
        where: { id },
        include: { project: { include: { members: true } } }
    });
    if (!task) {
        throw new ErrorHandler_1.AppError('Task not found', 404);
    }
    // Validate new assignee
    if (assignedTo) {
        const assignee = await prisma_1.default.user.findUnique({
            where: { id: assignedTo }
        });
        if (!assignee) {
            throw new ErrorHandler_1.AppError('User not found', 404);
        }
        // For non-super-admins, check if assignee is project member
        if (currentUser.role !== 'SUPER_ADMIN') {
            const isMember = task.project.members.some(m => m.userId === assignedTo);
            if (!isMember) {
                throw new ErrorHandler_1.AppError('Can only assign to project members', 403);
            }
        }
    }
    // Update task
    const updatedTask = await prisma_1.default.task.update({
        where: { id },
        data: { assignedTo },
        include: {
            assignee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });
    // Create notification
    if (assignedTo) {
        await prisma_1.default.notification.create({
            data: {
                userId: assignedTo,
                title: 'Task Assigned to You',
                message: `You have been assigned to: ${task.title}`,
                type: 'task_assigned',
                link: `/dashboard/tasks/${task.id}`
            }
        });
    }
    // Log activity
    await prisma_1.default.activityLog.create({
        data: {
            type: 'TASK_ASSIGNED',
            performedById: currentUser.userId,
            targetId: id,
            targetType: 'task',
            details: {
                previousAssignee: task.assignedTo,
                newAssignee: assignedTo
            }
        }
    });
    res.status(200).json({
        success: true,
        message: 'Task assigned successfully',
        data: updatedTask
    });
});
// GET /api/tasks/available-developers - Get developers for task assignment
exports.getAvailableDevelopers = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { projectId } = req.query;
    const currentUser = req.user;
    if (!projectId) {
        throw new ErrorHandler_1.AppError('Project ID is required', 400);
    }
    // Get project with members
    const project = await prisma_1.default.project.findUnique({
        where: { id: projectId },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                            skills: true,
                            assignedTasks: {
                                where: {
                                    status: { in: ['TODO', 'IN_PROGRESS'] }
                                },
                                select: { id: true }
                            }
                        }
                    }
                }
            }
        }
    });
    if (!project) {
        throw new ErrorHandler_1.AppError('Project not found', 404);
    }
    // Format response with workload info
    const developers = project.members.map(member => ({
        ...member.user,
        currentTaskCount: member.user.assignedTasks.length
    }));
    res.status(200).json({
        success: true,
        data: developers
    });
});
// GET /api/tasks/my-tasks - Get current user's tasks
exports.getMyTasks = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const currentUser = req.user;
    const { status, priority } = req.query;
    const where = {
        assignedTo: currentUser.userId
    };
    if (status)
        where.status = status;
    if (priority)
        where.priority = priority;
    const tasks = await prisma_1.default.task.findMany({
        where,
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    status: true
                }
            },
            creator: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            }
        },
        orderBy: [
            { dueDate: 'asc' },
            { priority: 'desc' }
        ]
    });
    res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks
    });
});
// PATCH /api/tasks/:id - Update task (including self-assignment)
exports.updateTask = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;
    const updates = req.body;
    const task = await prisma_1.default.task.findUnique({
        where: { id },
        include: { project: true }
    });
    if (!task) {
        throw new ErrorHandler_1.AppError('Task not found', 404);
    }
    // Check if user can update this task
    const isCreator = task.createdBy === currentUser.userId;
    const isAssignee = task.assignedTo === currentUser.userId;
    const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
    if (!isCreator && !isAssignee && !isAdmin) {
        throw new ErrorHandler_1.AppError('You do not have permission to update this task', 403);
    }
    // If trying to change assignment, check permission
    if (updates.assignedTo !== undefined && updates.assignedTo !== task.assignedTo) {
        if (!canAssignTask(currentUser) && updates.assignedTo !== currentUser.userId) {
            throw new ErrorHandler_1.AppError('You can only assign tasks to yourself', 403);
        }
    }
    const updatedTask = await prisma_1.default.task.update({
        where: { id },
        data: updates,
        include: {
            assignee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            },
            project: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
    // Log activity
    await prisma_1.default.activityLog.create({
        data: {
            type: 'TASK_UPDATED',
            performedById: currentUser.userId,
            targetId: id,
            targetType: 'task',
            details: { updates: Object.keys(updates) }
        }
    });
    res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: updatedTask
    });
});
// GET /api/tasks/:id - Get single task details
exports.getTaskById = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;
    const task = await prisma_1.default.task.findUnique({
        where: { id },
        include: {
            assignee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true
                }
            },
            creator: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            },
            project: {
                select: {
                    id: true,
                    name: true,
                    status: true
                }
            }
        }
    });
    if (!task) {
        throw new ErrorHandler_1.AppError('Task not found', 404);
    }
    // Check if user has permission to view this task
    const isCreator = task.createdBy === currentUser.userId;
    const isAssignee = task.assignedTo === currentUser.userId;
    const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
    if (!isCreator && !isAssignee && !isAdmin) {
        throw new ErrorHandler_1.AppError('You do not have permission to view this task', 403);
    }
    res.status(200).json({
        success: true,
        data: task
    });
});
// DELETE /api/tasks/:id - Delete task
exports.deleteTask = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;
    const task = await prisma_1.default.task.findUnique({
        where: { id }
    });
    if (!task) {
        throw new ErrorHandler_1.AppError('Task not found', 404);
    }
    // Only creator or admin can delete
    const isCreator = task.createdBy === currentUser.userId;
    const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
    if (!isCreator && !isAdmin) {
        throw new ErrorHandler_1.AppError('You do not have permission to delete this task', 403);
    }
    await prisma_1.default.task.delete({
        where: { id }
    });
    // Log activity
    await prisma_1.default.activityLog.create({
        data: {
            type: 'TASK_DELETED',
            performedById: currentUser.userId,
            targetId: id,
            targetType: 'task',
            details: { title: task.title }
        }
    });
    res.status(200).json({
        success: true,
        message: 'Task deleted successfully'
    });
});
// // GET /api/tasks - Get all tasks (filtered by role)
// export const getAllTasks = asyncHandler(async (req: Request, res: Response) => {
//   const currentUser = (req as any).user;
//   const { status, priority, projectId } = req.query;
//   const where: any = {};
//   // Non-admins only see their assigned tasks or tasks they created
//   if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
//     where.OR = [
//       { assignedTo: currentUser.userId },
//       { createdBy: currentUser.userId }
//     ];
//   }
//   // Apply filters
//   if (status) where.status = status;
//   if (priority) where.priority = priority;
//   if (projectId) where.projectId = projectId;
//   const tasks = await prisma.task.findMany({
//     where,
//     include: {
//       assignee: {
//         select: {
//           id: true,
//           firstName: true,
//           lastName: true,
//           email: true
//         }
//       },
//       project: {
//         select: {
//           id: true,
//           name: true,
//           status: true
//         }
//       },
//       creator: {
//         select: {
//           id: true,
//           firstName: true,
//           lastName: true
//         }
//       }
//     },
//     orderBy: [
//       { dueDate: 'asc' },
//       { createdAt: 'desc' }
//     ]
//   });
//   res.status(200).json({
//     success: true,
//     count: tasks.length,
//     data: tasks
//   });
// });
// GET /api/tasks - Get all tasks (filtered by role)
// GET /api/tasks - Get all tasks (filtered by role)
exports.getAllTasks = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    console.log('=== GET /api/tasks called ===');
    console.log('User:', req.user);
    const currentUser = req.user;
    const { status, priority, projectId } = req.query;
    console.log('Query params:', { status, priority, projectId });
    const where = {};
    // Admins see all tasks, others see only their tasks or tasks they created
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
        where.OR = [
            { assignedTo: currentUser.userId || currentUser.id },
            { createdBy: currentUser.userId || currentUser.id }
        ];
    }
    // Apply filters
    if (status)
        where.status = status;
    if (priority)
        where.priority = priority;
    if (projectId)
        where.projectId = projectId;
    console.log('Prisma query where:', where);
    try {
        console.log('Starting Prisma query...');
        const tasks = await prisma_1.default.task.findMany({
            where,
            include: {
                assignee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                },
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: [
                { dueDate: 'asc' },
                { createdAt: 'desc' }
            ]
        });
        console.log(`Found ${tasks.length} tasks`);
        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    }
    catch (error) {
        console.error('Error in getAllTasks:', error);
        throw error;
    }
});
