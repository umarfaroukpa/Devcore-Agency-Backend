"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Settings_controllers_1 = require("../controllers/Settings.controllers");
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const settingsRouter = (0, express_1.Router)();
// All settings routes require admin access
settingsRouter.use(Auth_middleware_1.authenticate, (0, Auth_middleware_1.restrictTo)(['SUPER_ADMIN']));
// Get all settings
settingsRouter.get('/', Settings_controllers_1.getSettings);
// Get system info
settingsRouter.get('/system-info', Settings_controllers_1.getSystemInfo);
// Get specific setting section
settingsRouter.get('/:section', Settings_controllers_1.getSettingSection);
// Update settings
settingsRouter.put('/', Settings_controllers_1.updateSettings);
// Test email configuration
settingsRouter.post('/test-email', Settings_controllers_1.testEmailSettings);
// Reset to defaults
settingsRouter.post('/reset', Settings_controllers_1.resetSettings);
// Export settings
settingsRouter.get('/export', Settings_controllers_1.exportSettings);
// Import settings
settingsRouter.post('/import', Settings_controllers_1.importSettings);
// Validate settings
settingsRouter.post('/validate', Settings_controllers_1.validateSettings);
exports.default = settingsRouter;
