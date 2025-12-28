"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTimeLog = exports.getTaskTimeLogs = exports.addTaskComment = exports.getTaskComments = exports.getDeveloperStats = exports.viewLogs = exports.deployTool = exports.updateTaskStatus = exports.getTaskById = exports.getDeveloperTasks = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const ErrorHandler_1 = require("../middleware/ErrorHandler");
const child_process_1 = require("child_process");
const util_1 = require("util");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// GET /api/dev/tasks - Fetch developer tasks
exports.getDeveloperTasks = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const developerId = req.user?.id;
    if (!developerId) {
        throw new ErrorHandler_1.AppError('User not authenticated', 401);
    }
    const { status, priority } = req.query;
    // Build filter
    const where = {
        OR: [
            { assignedTo: developerId },
            { createdBy: developerId }
        ]
    };
    if (status) {
        where.status = status;
    }
    if (priority) {
        where.priority = priority;
    }
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
        data: tasks
    });
});
// GET /api/dev/tasks/:id - Get task details
exports.getTaskById = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const developerId = req.user?.id;
    const task = await prisma_1.default.task.findFirst({
        where: {
            id,
            OR: [
                { assignedTo: developerId },
                { createdBy: developerId }
            ]
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
        throw new ErrorHandler_1.AppError('Task not found or access denied', 404);
    }
    res.status(200).json({
        success: true,
        data: task
    });
});
// PATCH /api/dev/tasks/:id - Update task status
exports.updateTaskStatus = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const developerId = req.user?.id;
    const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    if (!validStatuses.includes(status)) {
        throw new ErrorHandler_1.AppError('Invalid status', 400);
    }
    // Verify task belongs to developer
    const existingTask = await prisma_1.default.task.findFirst({
        where: {
            id,
            assignedTo: developerId
        }
    });
    if (!existingTask) {
        throw new ErrorHandler_1.AppError('Task not found or access denied', 404);
    }
    const task = await prisma_1.default.task.update({
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
exports.deployTool = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const developerId = req.user?.id;
    const { branch = 'main', environment = 'production' } = req.body;
    // Log deployment attempt
    console.log(`🚀 Deployment initiated by developer: ${developerId}`);
    console.log(`Branch: ${branch}, Environment: ${environment}`);
    // Example deployment script 
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
        await prisma_1.default.activityLog.create({
            data: {
                type: 'TASK_UPDATED',
                performedById: developerId,
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
    }
    catch (error) {
        console.error('Deployment failed:', error);
        // Log the failure
        await prisma_1.default.activityLog.create({
            data: {
                type: 'TASK_UPDATED',
                performedById: developerId,
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
        throw new ErrorHandler_1.AppError(`Deployment failed: ${error?.message ?? String(error)}`, 500);
    }
});
// GET /api/dev/logs - View system logs
exports.viewLogs = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { lines = 100, type = 'application' } = req.query;
    try {
        // Option 1: Read from log file
        const logPath = path_1.default.join(__dirname, '../../logs', `${type}.log`);
        let logs = [];
        try {
            const logContent = await promises_1.default.readFile(logPath, 'utf-8');
            logs = logContent
                .split('\n')
                .filter(line => line.trim())
                .slice(-Number(lines)); // Get last N lines
        }
        catch (fileError) {
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
    }
    catch (error) {
        throw new ErrorHandler_1.AppError(`Failed to retrieve logs: ${error.message}`, 500);
    }
});
// GET /api/dev/stats - Developer statistics
exports.getDeveloperStats = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const developerId = req.user?.id;
    const [totalTasks, completedTasks, inProgressTasks, projects] = await Promise.all([
        prisma_1.default.task.count({ where: { assignedTo: developerId } }),
        prisma_1.default.task.count({ where: { assignedTo: developerId, status: 'DONE' } }),
        prisma_1.default.task.count({ where: { assignedTo: developerId, status: 'IN_PROGRESS' } }),
        prisma_1.default.projectMember.count({ where: { userId: developerId } })
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
// Get task comments
exports.getTaskComments = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const developerId = req.user?.id;
    // Verify task belongs to developer
    const task = await prisma_1.default.task.findFirst({
        where: {
            id,
            OR: [
                { assignedTo: developerId },
                { createdBy: developerId }
            ]
        }
    });
    if (!task) {
        throw new ErrorHandler_1.AppError('Task not found or access denied', 404);
    }
    const comments = await prisma_1.default.comment.findMany({
        where: { taskId: id },
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
// Add task comment
exports.addTaskComment = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const developerId = req.user?.id;
    const { content } = req.body;
    if (!content) {
        throw new ErrorHandler_1.AppError('Comment content is required', 400);
    }
    // Verify task belongs to developer
    const task = await prisma_1.default.task.findFirst({
        where: {
            id,
            OR: [
                { assignedTo: developerId },
                { createdBy: developerId }
            ]
        }
    });
    if (!task) {
        throw new ErrorHandler_1.AppError('Task not found or access denied', 404);
    }
    const comment = await prisma_1.default.comment.create({
        data: {
            content,
            taskId: id,
            userId: developerId
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
            type: 'TASK_UPDATED',
            performedById: developerId,
            targetId: id,
            targetType: 'task',
            details: {
                action: 'comment_added',
                commentId: comment.id,
                taskTitle: task.title
            }
        }
    });
    res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment
    });
});
// Get task time logs
exports.getTaskTimeLogs = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const developerId = req.user?.id;
    // Verify task belongs to developer
    const task = await prisma_1.default.task.findFirst({
        where: {
            id,
            OR: [
                { assignedTo: developerId },
                { createdBy: developerId }
            ]
        }
    });
    if (!task) {
        throw new ErrorHandler_1.AppError('Task not found or access denied', 404);
    }
    const timeLogs = await prisma_1.default.timeLog.findMany({
        where: { taskId: id },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
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
// Add time log
exports.addTimeLog = (0, ErrorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const developerId = req.user?.id;
    const { hours, description, date } = req.body;
    if (!hours || !description) {
        throw new ErrorHandler_1.AppError('Hours and description are required', 400);
    }
    // Verify task belongs to developer
    const task = await prisma_1.default.task.findFirst({
        where: {
            id,
            OR: [
                { assignedTo: developerId },
                { createdBy: developerId }
            ]
        }
    });
    if (!task) {
        throw new ErrorHandler_1.AppError('Task not found or access denied', 404);
    }
    const timeLog = await prisma_1.default.timeLog.create({
        data: {
            hours: parseFloat(hours),
            description,
            date: date ? new Date(date) : new Date(),
            taskId: id,
            userId: developerId
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
    // Update task actual hours
    const totalHours = await prisma_1.default.timeLog.aggregate({
        where: { taskId: id },
        _sum: { hours: true }
    });
    await prisma_1.default.task.update({
        where: { id },
        data: { actualHours: Math.round(totalHours._sum.hours || 0) }
    });
    // Create activity log
    await prisma_1.default.activityLog.create({
        data: {
            type: 'TASK_UPDATED',
            performedById: developerId,
            targetId: id,
            targetType: 'task',
            details: {
                action: 'time_logged',
                hours: parseFloat(hours),
                taskTitle: task.title
            }
        }
    });
    res.status(201).json({
        success: true,
        message: 'Time logged successfully',
        data: timeLog
    });
});
