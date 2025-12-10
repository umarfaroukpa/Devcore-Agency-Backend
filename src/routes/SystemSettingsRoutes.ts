import { Router } from 'express';
import { getSettings,  updateSettings, testEmailSettings, getSettingSection, resetSettings, exportSettings, importSettings, validateSettings, getSystemInfo } from '../controllers/Settings.controllers';
import { authenticate, restrictTo } from '../middleware/Auth.middleware';

const settingsRouter = Router();

// All settings routes require admin access
settingsRouter.use(authenticate, restrictTo(['SUPER_ADMIN']));

// Get all settings
settingsRouter.get('/', getSettings);

// Get system info
settingsRouter.get('/system-info', getSystemInfo);

// Get specific setting section
settingsRouter.get('/:section', getSettingSection);

// Update settings
settingsRouter.put('/', updateSettings);

// Test email configuration
settingsRouter.post('/test-email', testEmailSettings);

// Reset to defaults
settingsRouter.post('/reset', resetSettings);

// Export settings
settingsRouter.get('/export', exportSettings);

// Import settings
settingsRouter.post('/import', importSettings);

// Validate settings
settingsRouter.post('/validate', validateSettings);

export default settingsRouter;