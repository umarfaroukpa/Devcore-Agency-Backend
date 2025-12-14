import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler, AppError } from '../middleware/ErrorHandler';

interface AuthRequest extends Request {
 user?: {
    id: string;
    role: string;
    email: string;
    firstName?: string; 
    lastName?: string;
    isActive?: boolean;
 };
}

// GET /api/clients - Get all clients (Admin/Manager only)
export const getAllClients = asyncHandler(async (req: Request, res: Response) => {
 const { search, industry } = req.query;

  const where: any = {
    role: 'CLIENT'
  };
 if (search) {
   where.OR = [
    { firstName: { contains: search as string, mode: 'insensitive' } },
    { lastName: { contains: search as string, mode: 'insensitive' } },
    { email: { contains: search as string, mode: 'insensitive' } },
    { companyName: { contains: search as string, mode: 'insensitive' } }
    ];
  }
  if (industry) {
    where.industry = industry as string;
 }
const clients = await prisma.user.findMany({
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
export const getClientDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

    const client = await prisma.user.findFirst({
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
    throw new AppError('Client not found', 404);
 }

  res.status(200).json({
 success: true,
   data: client
 });
});

//api/clients/:id/role - Update client role
export const updateClientRole = asyncHandler(async (req: Request, res: Response) => {
 const { id } = req.params;
 const { role } = req.body;

 const validRoles = ['CLIENT', 'DEVELOPER', 'ADMIN'];
 if (!validRoles.includes(role)) {
    throw new AppError('Invalid role', 400);
 }

 const client = await prisma.user.update({
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
export const getClientProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;
  const { status } = req.query;

  // Build OR conditions array
  const orConditions: any[] = [
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

  const where: any = {
    AND: [
      { OR: orConditions }
    ]
  };

  // Apply status filter if present
  if (status) {
    where.AND.push({ status: status as string });
  }
  
  const projects = await prisma.project.findMany({
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
export const getProjectDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  // Build OR conditions array with explicit typing
  const orConditions: any[] = [
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

  const project = await prisma.project.findFirst({
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
    throw new AppError('Project not found or access denied', 404);
  }

  res.status(200).json({
    success: true,
    data: project
  });
});

// POST /api/clients/projects - Create new project
export const createProject = asyncHandler(async (req: AuthRequest, res: Response) => {
 const clientId = req.user?.id;
 const { name, description, budget, startDate, endDate } = req.body;

  if (!name) {
    throw new AppError('Project name is required', 400);
  }
 // Get client info
  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      companyName: true
    }
 });

 if (!client) {
   throw new AppError('Client not found', 404);
 }

 const project = await prisma.project.create({
 data: {
   name,
    description,
     budget,
     startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      clientName: client.companyName || `${client.firstName} ${client.lastName}`,
      clientEmail: client.email,
      clientId: clientId!,
      members: {
      create: {
      userId: clientId!,
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
export const getClientStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const clientId = req.user?.id;

  const projects = await prisma.project.findMany({
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
    completedTasks: projects.reduce((sum, p) => 
      sum + p.tasks.filter(t => t.status === 'DONE').length, 0
    )
  };
  res.status(200).json({
    success: true,
    data: stats
 });
});

// GET /api/clients/projects/:id/comments - Get project comments
export const getProjectComments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  // Verify project access
  const project = await prisma.project.findFirst({
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
    throw new AppError('Project not found or access denied', 404);
  }

  const comments = await prisma.comment.findMany({
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
export const addProjectComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { content } = req.body;

  if (!content) {
    throw new AppError('Comment content is required', 400);
  }

  // Verify project access
  const project = await prisma.project.findFirst({
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
    throw new AppError('Project not found or access denied', 404);
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      projectId: id,
      userId: userId!
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
  await prisma.activityLog.create({
    data: {
      type: 'PROJECT_UPDATED',
      performedBy: userId,
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
export const getProjectTimeLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Verify project access
  const project = await prisma.project.findFirst({
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
    throw new AppError('Project not found or access denied', 404);
  }

  const timeLogs = await prisma.timeLog.findMany({
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
export const addProjectTimeLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { hours, description, date } = req.body;

  if (!hours || !description) {
    throw new AppError('Hours and description are required', 400);
  }

  // Verify project access
  const project = await prisma.project.findFirst({
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
    throw new AppError('Project not found or access denied', 404);
  }

  // Create a general project task if no specific task exists
  let task = await prisma.task.findFirst({
    where: {
      projectId: id,
      title: "General Project Work"
    }
  });

  if (!task) {
    task = await prisma.task.create({
      data: {
        title: "General Project Work",
        description: "General project activities and discussions",
        projectId: id,
        createdBy: userId!,
        status: 'DONE'
      }
    });
  }

  const timeLog = await prisma.timeLog.create({
    data: {
      hours: parseFloat(hours),
      description,
      date: date ? new Date(date) : new Date(),
      taskId: task.id,
      userId: userId!
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
  await prisma.activityLog.create({
    data: {
      type: 'PROJECT_UPDATED',
      performedBy: userId,
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