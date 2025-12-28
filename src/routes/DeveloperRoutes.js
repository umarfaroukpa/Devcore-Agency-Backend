"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Developer_controller_1 = require("../controllers/Developer.controller");
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const router = (0, express_1.Router)();
// All routes restricted to 'developer'
router.use(Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['DEVELOPER', 'ADMIN', 'SUPER_ADMIN']));
router.get('/stats', Developer_controller_1.getDeveloperStats);
router.get('/tasks', Developer_controller_1.getDeveloperTasks);
router.get('/tasks/:id', Developer_controller_1.getTaskById);
router.patch('/tasks/:id', Developer_controller_1.updateTaskStatus);
router.get('/tasks/:id/comments', Developer_controller_1.getTaskComments);
router.post('/tasks/:id/comments', Developer_controller_1.addTaskComment);
router.get('/tasks/:id/time-logs', Developer_controller_1.getTaskTimeLogs);
router.post('/tasks/:id/time-logs', Developer_controller_1.addTimeLog);
router.post('/deploy', Developer_controller_1.deployTool);
router.get('/logs', Developer_controller_1.viewLogs);
exports.default = router;
