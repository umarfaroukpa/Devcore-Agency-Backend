import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler, AppError } from '../middleware/ErrorHandler';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

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

// GET /api/dev/tasks - Fetch developer tasks
export const getDeveloperTasks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const developerId = req.user?.id;  // Changed from userId to id

  if (!developerId) {
    throw new AppError('User not authenticated', 401);
  }

  const { status, priority } = req.query;

  // Build filter
  const where: any = {
    assignedTo: developerId
  };

  if (status) {
    where.status = status as string;
  }

  if (priority) {
    where.priority = priority as string;
  }

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
          email: true
        }
      }
    },
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' }
    ]
  });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks
  });
});

// GET /api/dev/tasks/:id - Get task details
export const getTaskById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const developerId = req.user?.id;  // Changed from userId to id

  const task = await prisma.task.findFirst({
    where: {
      id,
      assignedTo: developerId // Ensure developer can only see their tasks
    },
    include: {
      project: true,
      creator: {
        select: {
          firstName: true,
          email: true
        }
      },
      assignee: {
        select: {
          firstName: true,
          email: true
        }
      }
    }
  });

  if (!task) {
    throw new AppError('Task not found or access denied', 404);
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// PATCH /api/dev/tasks/:id - Update task status
export const updateTaskStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const developerId = req.user?.id;  // Changed from userId to id

  const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  // Verify task belongs to developer
  const existingTask = await prisma.task.findFirst({
    where: {
      id,
      assignedTo: developerId
    }
  });

  if (!existingTask) {
    throw new AppError('Task not found or access denied', 404);
  }

  const task = await prisma.task.update({
    where: { id },
    data: { status }
  });

  res.status(200).json({
    success: true,
    message: 'Task status updated',
    data: task
  });
});

// POST /api/dev/deploy - Trigger deployment
export const deployTool = asyncHandler(async (req: AuthRequest, res: Response) => {
  const developerId = req.user?.id; 
  const { branch = 'main', environment = 'production' } = req.body;
  // Log deployment attempt
  console.log(`🚀 Deployment initiated by developer: ${developerId}`);
  console.log(`Branch: ${branch}, Environment: ${environment}`);

  // Example deployment script (customize based on your setup)
  try {
    // Option 1: Execute a deployment script
    const { stdout, stderr } = await execAsync(`npm run build`);
    
    console.log('Deployment output:', stdout);
    
    if (stderr) {
      console.error('Deployment warnings:', stderr);
    }

    // Option 2: Trigger CI/CD pipeline (GitHub Actions, Jenkins, etc.)
    // await fetch('https://api.github.com/repos/owner/repo/actions/workflows/deploy.yml/dispatches', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `token ${process.env.GITHUB_TOKEN}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ ref: 'main' })
    // });

    // Option 3: Custom deployment script
    // You can create a deploy.sh or deploy.js script
    // const deployScript = path.join(__dirname, '../../scripts/deploy.js');
    // const { stdout, stderr } = await execAsync(`node ${deployScript} ${environment}`);

    // Option 4: Direct commands
    // const { stdout, stderr } = await execAsync('git pull && npm install && npm run build');


    // Log the deployment
    await prisma.activityLog.create({
      data: {
        type: 'TASK_UPDATED', 
        performedBy: developerId,
        targetType: 'deployment',
        details: {
          action: 'deploy',
          environment,
          branch,
          status: 'success',
          timestamp: new Date().toISOString()
        }
      }
    });


    res.status(202).json({
      success: true,
      message: 'Deployment initiated successfully. Check logs for status.',
      output: stdout
    });

  } catch (error: any) {
    console.error('Deployment failed:', error);

    // Log the failure
    await prisma.activityLog.create({
      data: {
        type: 'TASK_UPDATED',
        performedBy: developerId,
        targetType: 'deployment',
        details: {
          action: 'deploy',
          environment,
          branch,
          status: 'failed',
          error: error?.message ?? String(error),
          timestamp: new Date().toISOString()
        }
      }
    });

    throw new AppError(`Deployment failed: ${error?.message ?? String(error)}`, 500);
  }
  
});

// GET /api/dev/logs - View system logs
export const viewLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { lines = 100, type = 'application' } = req.query;

  try {
    // Option 1: Read from log file
    const logPath = path.join(__dirname, '../../logs', `${type}.log`);
    
    let logs: string[] = [];
    
    try {
      const logContent = await fs.readFile(logPath, 'utf-8');
      logs = logContent
        .split('\n')
        .filter(line => line.trim())
        .slice(-Number(lines)); // Get last N lines
    } catch (fileError) {
      console.error('Error reading log file:', fileError);
      logs = ['Log file not found or empty'];
    }

    // Option 2: Get logs from logging service (e.g., Winston, Bunyan)
    // const logs = await loggingService.getLogs({ lines, type });

    // Option 3: Get logs from cloud service (AWS CloudWatch, etc.)
    // const logs = await cloudwatch.getLogEvents(...);

    res.status(200).json({
      success: true,
      type,
      lines: logs.length,
      logs
    });

  } catch (error: any) {
    throw new AppError(`Failed to retrieve logs: ${error.message}`, 500);
  }
});

// GET /api/dev/stats - Developer statistics
export const getDeveloperStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const developerId = req.user?.id;  // Changed from userId to id

  const [
    totalTasks,
    completedTasks,
    inProgressTasks,
    projects
  ] = await Promise.all([
    prisma.task.count({ where: { assignedTo: developerId } }),
    prisma.task.count({ where: { assignedTo: developerId, status: 'DONE' } }),
    prisma.task.count({ where: { assignedTo: developerId, status: 'IN_PROGRESS' } }),
    prisma.projectMember.count({ where: { userId: developerId } })
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      projects
    }
  });
});