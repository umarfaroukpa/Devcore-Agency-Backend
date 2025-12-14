import { Router } from 'express';
import { getDeveloperTasks, getTaskById, updateTaskStatus, deployTool, viewLogs, getDeveloperStats, getTaskComments, addTaskComment, getTaskTimeLogs, addTimeLog} from '../controllers/Developer.controller';
import { authenticate, restrictTo } from '../middleware/Auth.middleware';


const router = Router();

// All routes restricted to 'developer'
router.use(authenticate, restrictTo(['DEVELOPER', 'ADMIN', 'SUPER_ADMIN']));

router.get('/stats', getDeveloperStats);
router.get('/tasks', getDeveloperTasks);
router.get('/tasks/:id', getTaskById);
router.patch('/tasks/:id', updateTaskStatus);
router.get('/tasks/:id/comments', getTaskComments);
router.post('/tasks/:id/comments', addTaskComment);
router.get('/tasks/:id/time-logs', getTaskTimeLogs);
router.post('/tasks/:id/time-logs', addTimeLog);
router.post('/deploy', deployTool);
router.get('/logs', viewLogs);

export default router;