import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { asyncHandler, AppError } from '../middleware/ErrorHandler';

interface SystemSettings {
  general: {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    dateFormat: string;
    language: string;
  };
  security: {
    requireEmailVerification: boolean;
    enable2FA: boolean;
    passwordMinLength: number;
    passwordRequireSpecial: boolean;
    passwordRequireNumbers: boolean;
    sessionTimeout: number;
    loginAttempts: number;
  };
  notifications: {
    emailNotifications: boolean;
    newUserAlerts: boolean;
    taskAssignmentAlerts: boolean;
    projectUpdates: boolean;
    systemMaintenance: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    encryption: 'none' | 'ssl' | 'tls';
  };
}

const defaultSettings: SystemSettings = {
  general: {
    siteName: process.env.SITE_NAME || 'Project Management System',
    siteUrl: process.env.SITE_URL || 'http://localhost:3000',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
    timezone: process.env.TIMEZONE || 'UTC',
    dateFormat: process.env.DATE_FORMAT || 'MM/DD/YYYY',
    language: process.env.LANGUAGE || 'en'
  },
  security: {
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
    enable2FA: process.env.ENABLE_2FA === 'true',
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
    passwordRequireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
    passwordRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '60'),
    loginAttempts: parseInt(process.env.LOGIN_ATTEMPTS || '5')
  },
  notifications: {
    emailNotifications: process.env.EMAIL_NOTIFICATIONS !== 'false',
    newUserAlerts: process.env.NEW_USER_ALERTS !== 'false',
    taskAssignmentAlerts: process.env.TASK_ASSIGNMENT_ALERTS !== 'false',
    projectUpdates: process.env.PROJECT_UPDATES !== 'false',
    systemMaintenance: process.env.SYSTEM_MAINTENANCE !== 'false'
  },
  email: {
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUsername: process.env.SMTP_USERNAME || '',
    smtpPassword: process.env.SMTP_PASSWORD || '',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@example.com',
    fromName: process.env.SMTP_FROM_NAME || 'Project Management System',
    encryption: (process.env.SMTP_ENCRYPTION as 'none' | 'ssl' | 'tls') || 'tls'
  }
};

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

// Ensure settings directory exists
const ensureSettingsDir = async () => {
  const dir = path.dirname(SETTINGS_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

// Load settings from file
const loadSettings = async (): Promise<SystemSettings> => {
  try {
    await ensureSettingsDir();
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const savedSettings = JSON.parse(data);
    
    // Merge with defaults for any missing properties
    return {
      general: { ...defaultSettings.general, ...savedSettings.general },
      security: { ...defaultSettings.security, ...savedSettings.security },
      notifications: { ...defaultSettings.notifications, ...savedSettings.notifications },
      email: { ...defaultSettings.email, ...savedSettings.email }
    };
  } catch (error) {
    // If file doesn't exist or is corrupt, return defaults
    return defaultSettings;
  }
};

// Save settings to file
const saveSettings = async (settings: SystemSettings): Promise<void> => {
  await ensureSettingsDir();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
};

// Get system settings
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await loadSettings();
  
  res.status(200).json({
    success: true,
    data: settings
  });
});

// Update system settings
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const settingsData: Partial<SystemSettings> = req.body;
  const currentUser = (req as any).user;
  
  // Validate required fields
  if (settingsData.general && (!settingsData.general.siteName || !settingsData.general.siteUrl)) {
    throw new AppError('Site name and URL are required', 400);
  }
  
  // Load current settings
  const currentSettings = await loadSettings();
  
  // Merge new settings with current settings
  const updatedSettings: SystemSettings = {
    general: { ...currentSettings.general, ...settingsData.general },
    security: { ...currentSettings.security, ...settingsData.security },
    notifications: { ...currentSettings.notifications, ...settingsData.notifications },
    email: { ...currentSettings.email, ...settingsData.email }
  };
  
  // Validate email settings if email notifications are enabled
  if (updatedSettings.notifications.emailNotifications) {
    if (!updatedSettings.email.smtpHost || !updatedSettings.email.smtpPort || !updatedSettings.email.smtpUsername) {
      throw new AppError('SMTP configuration is required when email notifications are enabled', 400);
    }
  }
  
  // Save to file
  await saveSettings(updatedSettings);
  
  // Update environment variables for current session
  if (settingsData.general) {
    if (settingsData.general.siteName) process.env.SITE_NAME = settingsData.general.siteName;
    if (settingsData.general.siteUrl) process.env.SITE_URL = settingsData.general.siteUrl;
    if (settingsData.general.adminEmail) process.env.ADMIN_EMAIL = settingsData.general.adminEmail;
  }
  
  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: updatedSettings
  });
});

// Test email settings
export const testEmailSettings = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    throw new AppError('Email address is required for testing', 400);
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email address', 400);
  }
  
  // Load current settings
  const settings = await loadSettings();
  
  // In a real implementation, you would use nodemailer to send a test email
  // For now, return a simulated response
  
  const testResult = {
    success: true,
    message: 'Test email would be sent to your email address',
    details: {
      to: email,
      from: settings.email.fromEmail,
      smtpHost: settings.email.smtpHost,
      smtpPort: settings.email.smtpPort,
      encryption: settings.email.encryption,
      status: 'simulated'
    }
  };
  
  res.status(200).json({
    success: true,
    message: 'Email test simulation completed',
    data: testResult
  });
});

// Get specific setting section
export const getSettingSection = asyncHandler(async (req: Request, res: Response) => {
  const { section } = req.params;
  
  const validSections = ['general', 'security', 'notifications', 'email'];
  
  if (!validSections.includes(section)) {
    throw new AppError('Invalid settings section', 400);
  }
  
  const settings = await loadSettings();
  
  res.status(200).json({
    success: true,
    data: settings[section as keyof SystemSettings]
  });
});

// Reset settings to defaults
export const resetSettings = asyncHandler(async (req: Request, res: Response) => {
  // Save default settings to file
  await saveSettings(defaultSettings);
  
  res.status(200).json({
    success: true,
    message: 'Settings reset to defaults',
    data: defaultSettings
  });
});

// Export settings (for backup)
export const exportSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await loadSettings();
  
  res.status(200).json({
    success: true,
    data: {
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
  });
});

// Import settings (from backup)
export const importSettings = asyncHandler(async (req: Request, res: Response) => {
  const { settings } = req.body;
  
  if (!settings) {
    throw new AppError('Settings data is required for import', 400);
  }
  
  // Validate the imported settings structure
  if (!settings.general || !settings.security || !settings.notifications || !settings.email) {
    throw new AppError('Invalid settings format', 400);
  }
  
  // Save imported settings
  await saveSettings(settings);
  
  res.status(200).json({
    success: true,
    message: 'Settings imported successfully'
  });
});

// Validate settings (for frontend validation)
export const validateSettings = asyncHandler(async (req: Request, res: Response) => {
  const settingsData: Partial<SystemSettings> = req.body;
  const errors: string[] = [];
  
  // Validate general settings if provided
  if (settingsData.general) {
    if (settingsData.general.siteName && settingsData.general.siteName.length < 2) {
      errors.push('Site name must be at least 2 characters');
    }
    
    if (settingsData.general.siteUrl && !settingsData.general.siteUrl.startsWith('http')) {
      errors.push('Site URL must start with http:// or https://');
    }
    
    if (settingsData.general.adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settingsData.general.adminEmail)) {
      errors.push('Admin email is invalid');
    }
  }
  
  // Validate security settings if provided
  if (settingsData.security) {
    if (settingsData.security.passwordMinLength && settingsData.security.passwordMinLength < 6) {
      errors.push('Password minimum length must be at least 6');
    }
    
    if (settingsData.security.sessionTimeout && (settingsData.security.sessionTimeout < 5 || settingsData.security.sessionTimeout > 1440)) {
      errors.push('Session timeout must be between 5 and 1440 minutes');
    }
    
    if (settingsData.security.loginAttempts && (settingsData.security.loginAttempts < 1 || settingsData.security.loginAttempts > 10)) {
      errors.push('Login attempts must be between 1 and 10');
    }
  }
  
  // Validate email settings if provided
  if (settingsData.email) {
    if (settingsData.email.smtpPort && (settingsData.email.smtpPort < 1 || settingsData.email.smtpPort > 65535)) {
      errors.push('SMTP port must be between 1 and 65535');
    }
    
    if (settingsData.email.fromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settingsData.email.fromEmail)) {
      errors.push('From email is invalid');
    }
  }
  
  res.status(200).json({
    success: errors.length === 0,
    errors,
    message: errors.length === 0 ? 'Settings are valid' : 'Validation failed'
  });
});

// Get system info (for settings page)
export const getSystemInfo = asyncHandler(async (req: Request, res: Response) => {
  const info = {
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    settingsFile: SETTINGS_FILE,
    settingsFileExists: false
  };
  
  try {
    await fs.access(SETTINGS_FILE);
    info.settingsFileExists = true;
  } catch {
    info.settingsFileExists = false;
  }
  
  res.status(200).json({
    success: true,
    data: info
  });
});