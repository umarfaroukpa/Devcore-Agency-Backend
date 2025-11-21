import { Router } from 'express';
import { restrictTo, authenticate } from '../middleware/Auth.middleware';
import {  getDeveloperTasks, getTaskById, updateTaskStatus, deployTool, viewLogs, getDeveloperStats } from '../controllers/Developer.controller';
 

const router = Router();

// All routes restricted to 'developer'
router.use(authenticate, restrictTo(['DEVELOPER', 'ADMIN']));

router.get('/stats', getDeveloperStats);
router.get('/tasks', getDeveloperTasks);
router.get('/tasks/:id', getTaskById);
router.patch('/tasks/:id', updateTaskStatus);
router.post('/deploy', deployTool);
router.get('/logs', viewLogs);

export default router;