"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const Services_controllers_1 = require("../controllers/Services.controllers");
const router = (0, express_1.Router)();
// Public route to view all available services
router.get('/', Services_controllers_1.getPublicServices);
// Protected routes for management (Admin/Manager only)
router.post('/', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['admin', 'manager']), Services_controllers_1.createService);
router.put('/:id', Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['admin', 'manager']), Services_controllers_1.updateService);
exports.default = router;
