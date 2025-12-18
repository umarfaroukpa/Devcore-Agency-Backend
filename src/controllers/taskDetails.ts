import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler, AppError } from '../middleware/ErrorHandler';

// Helper to check if user can assign tasks
const canAssignTask = (user: any) => {
  return user.role === 'SUPER_ADMIN' || 
         user.role === 'ADMIN' && user.canAssignTasks === true;
};

// POST /api/tasks - Create and assign task
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const {
    title,
    description,
    projectId,
    // Can be array for multiple assignments
    assignedTo, 
    priority = 'MEDIUM',
    dueDate,
    estimatedHours
  } = req.body;

  // Validate required fields
  if (!title || !projectId) {
    throw new AppError('Title and project ID are required', 400);
  }

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Check if user has permission to create tasks for this project
  const isMember = project.members.some(m => m.userId === currentUser.userId);
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
  
  if (!isMember && !isAdmin) {
    throw new AppError('You do not have permission to create tasks for this project', 403);
  }

  // If assigning to someone, check permission
  if (assignedTo && !canAssignTask(currentUser)) {
    throw new AppError('You do not have permission to assign tasks', 403);
  }

  // Validate assignee if provided
  if (assignedTo) {
    const assignee = await prisma.user.findUnique({
      where: { id: assignedTo }
    });

    if (!assignee) {
      throw new AppError('Assigned user not found', 404);
    }

    // Check if assignee is project member (for non-admins)
    if (!isAdmin) {
      const isAssigneeMember = project.members.some(m => m.userId === assignedTo);
      if (!isAssigneeMember) {
        throw new AppError('Can only assign tasks to project members', 403);
      }
    }
  }

  // Create task
  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      assignedTo,
      createdBy: currentUser.userId,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedHours
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
      }
    }
  });

  // Create notification for assignee
  if (assignedTo) {
    await prisma.notification.create({
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
  await prisma.activityLog.create({
    data: {
      type: 'TASK_CREATED',
      performedById: currentUser.userId,
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
export const assignTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { assignedTo } = req.body;
  const currentUser = (req as any).user;

  // Check permission
  if (!canAssignTask(currentUser)) {
    throw new AppError('You do not have permission to assign tasks', 403);
  }

  // Get task
  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: { include: { members: true } } }
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Validate new assignee
  if (assignedTo) {
    const assignee = await prisma.user.findUnique({
      where: { id: assignedTo }
    });

    if (!assignee) {
      throw new AppError('User not found', 404);
    }

    // For non-super-admins, check if assignee is project member
    if (currentUser.role !== 'SUPER_ADMIN') {
      const isMember = task.project.members.some(m => m.userId === assignedTo);
      if (!isMember) {
        throw new AppError('Can only assign to project members', 403);
      }
    }
  }

  // Update task
  const updatedTask = await prisma.task.update({
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
    await prisma.notification.create({
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
  await prisma.activityLog.create({
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
export const getAvailableDevelopers = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.query;
  const currentUser = (req as any).user;

  if (!projectId) {
    throw new AppError('Project ID is required', 400);
  }

  // Get project with members
  const project = await prisma.project.findUnique({
    where: { id: projectId as string },
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
    throw new AppError('Project not found', 404);
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
export const getMyTasks = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { status, priority } = req.query;

  const where: any = {
    assignedTo: currentUser.userId
  };

  if (status) where.status = status;
  if (priority) where.priority = priority;

  const tasks = await prisma.task.findMany({
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
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user;
  const updates = req.body;

  const task = await prisma.task.findUnique({
    where: { id },
    include: { project: true }
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Check if user can update this task
  const isCreator = task.createdBy === currentUser.userId;
  const isAssignee = task.assignedTo === currentUser.userId;
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  if (!isCreator && !isAssignee && !isAdmin) {
    throw new AppError('You do not have permission to update this task', 403);
  }

  // If trying to change assignment, check permission
  if (updates.assignedTo !== undefined && updates.assignedTo !== task.assignedTo) {
    if (!canAssignTask(currentUser) && updates.assignedTo !== currentUser.userId) {
      throw new AppError('You can only assign tasks to yourself', 403);
    }
  }

  const updatedTask = await prisma.task.update({
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
  await prisma.activityLog.create({
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
export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user;

  const task = await prisma.task.findUnique({
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
    throw new AppError('Task not found', 404);
  }

  // Check if user has permission to view this task
  const isCreator = task.createdBy === currentUser.userId;
  const isAssignee = task.assignedTo === currentUser.userId;
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  if (!isCreator && !isAssignee && !isAdmin) {
    throw new AppError('You do not have permission to view this task', 403);
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// DELETE /api/tasks/:id - Delete task
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = (req as any).user;

  const task = await prisma.task.findUnique({
    where: { id }
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Only creator or admin can delete
  const isCreator = task.createdBy === currentUser.userId;
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  if (!isCreator && !isAdmin) {
    throw new AppError('You do not have permission to delete this task', 403);
  }

  await prisma.task.delete({
    where: { id }
  });

  // Log activity
  // Log activity
  await prisma.activityLog.create({
    data: {
      type: 'TASK_DELETED' as any,
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

// GET /api/tasks - Get all tasks (filtered by role)
export const getAllTasks = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { status, priority, projectId } = req.query;

  const where: any = {};

  // Non-admins only see their assigned tasks or tasks they created
  if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
    where.OR = [
      { assignedTo: currentUser.userId },
      { createdBy: currentUser.userId }
    ];
  }

  // Apply filters
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (projectId) where.projectId = projectId;

  const tasks = await prisma.task.findMany({
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

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

export { canAssignTask };