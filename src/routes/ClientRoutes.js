"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Client_controllers_1 = require("../controllers/Client.controllers");
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const router = (0, express_1.Router)();
// Client's own routes
router.get('/projects', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['CLIENT', 'ADMIN', 'DEVELOPER']), Client_controllers_1.getClientProjects);
router.get('/projects/:id', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['CLIENT', 'ADMIN', 'DEVELOPER']), Client_controllers_1.getProjectDetails);
router.post('/projects', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['CLIENT', 'DEVELOPER', 'ADMIN']), Client_controllers_1.createProject);
router.get('/stats', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['CLIENT']), Client_controllers_1.getClientStats);
// New comment and time-log routes
router.get('/projects/:id/comments', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['CLIENT', 'ADMIN', 'DEVELOPER']), Client_controllers_1.getProjectComments);
router.post('/projects/:id/comments', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['CLIENT', 'ADMIN', 'DEVELOPER']), Client_controllers_1.addProjectComment);
router.get('/projects/:id/time-logs', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['CLIENT', 'ADMIN', 'DEVELOPER']), Client_controllers_1.getProjectTimeLogs);
router.post('/projects/:id/time-logs', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['CLIENT', 'ADMIN', 'DEVELOPER']), Client_controllers_1.addProjectTimeLog);
// Admin routes for managing clients
router.get('/', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['ADMIN']), Client_controllers_1.getAllClients);
router.get('/:id', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['ADMIN']), Client_controllers_1.getClientDetails);
router.patch('/:id/role', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['ADMIN']), Client_controllers_1.updateClientRole);
exports.default = router;
