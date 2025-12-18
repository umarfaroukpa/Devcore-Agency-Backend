import { Request, Response } from 'express';
import crypto from 'crypto';
import { asyncHandler } from '../middleware/ErrorHandler';
import prisma from '../config/prisma';
import { sendEmail } from '../utils/emailservices';
import { AppError } from '../middleware/ErrorHandler';

// Generate reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash token (for storage)
const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Forgot password - Request password reset
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Please provide an email address', 400);
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Always return success even if user doesn't exist (security best practice)
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link',
    });
  }

  // Check if user has too many reset requests (rate limiting)
  const recentRequests = await prisma.passwordReset.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
      },
    },
  });

  if (recentRequests >= 3) {
    throw new AppError('Too many reset requests. Please try again later.', 429);
  }

  // Generate reset token
  const resetToken = generateResetToken();
  const hashedToken = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete any existing reset tokens for this user
  await prisma.passwordReset.deleteMany({
    where: { userId: user.id },
  });

  // Create new reset token
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt,
    },
  });

  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  // Send email using your existing email service
  try {
    await sendEmail(
      user.email,
      'password-reset',
      {
        resetUrl,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      }
    );
    
    // Log activity - using existing USER_UPDATED type
    await prisma.activityLog.create({
      data: {
        type: 'USER_UPDATED', // Using existing enum value
        performedById: user.id,
        targetId: user.id,
        targetType: 'user',
        details: { 
          action: 'PASSWORD_RESET_REQUESTED',
          email: user.email,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.ip,
      },
    });

    // Also create a notification for the user
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Password Reset Requested',
        message: 'You have requested a password reset. Check your email for the reset link.',
        type: 'PASSWORD_RESET', // This should work with your existing Notification type
        link: '/profile/security',
      },
    });
  } catch (error) {
    console.error('Email sending error:', error);
    // If email fails, delete the token
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });
    throw new AppError('Failed to send reset email. Please try again.', 500);
  }

  res.status(200).json({
    success: true,
    message: 'If an account exists with this email, you will receive a password reset link',
  });
});

// Verify reset token
export const verifyResetToken = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    throw new AppError('Reset token is required', 400);
  }

  const hashedToken = hashToken(token);

  // Find reset token
  const resetToken = await prisma.passwordReset.findFirst({
    where: {
      token: hashedToken,
      expiresAt: {
        gt: new Date(), // Not expired
      },
      used: false,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
        },
      },
    },
  });

  if (!resetToken) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  res.status(200).json({
    success: true,
    data: {
      email: resetToken.user.email,
      firstName: resetToken.user.firstName,
    },
  });
});

// Reset password
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!token) {
    throw new AppError('Reset token is required', 400);
  }

  if (!password || !confirmPassword) {
    throw new AppError('Password and confirmation are required', 400);
  }

  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  // Password validation
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  const hashedToken = hashToken(token);

  // Find and validate reset token
  const resetToken = await prisma.passwordReset.findFirst({
    where: {
      token: hashedToken,
      expiresAt: {
        gt: new Date(),
      },
      used: false,
    },
    include: {
      user: true,
    },
  });

  if (!resetToken) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Update user password
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    // Update user password
    await tx.user.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    // Mark reset token as used
    await tx.passwordReset.update({
      where: { id: resetToken.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Delete all other reset tokens for this user
    await tx.passwordReset.deleteMany({
      where: {
        userId: resetToken.userId,
        id: { not: resetToken.id },
      },
    });

    // Log activity - using existing USER_UPDATED type
    await tx.activityLog.create({
      data: {
        type: 'USER_UPDATED', // Using existing enum value
        performedById: resetToken.userId,
        targetId: resetToken.userId,
        targetType: 'user',
        details: { 
          action: 'PASSWORD_RESET_SUCCESS',
          timestamp: new Date().toISOString()
        },
        ipAddress: req.ip,
      },
    });

    // Create notification for the user
    await tx.notification.create({
      data: {
        userId: resetToken.userId,
        title: 'Password Reset Successful',
        message: 'Your password has been successfully reset.',
        type: 'PASSWORD_RESET',
        link: '/profile/security',
      },
    });
  });

  // Send confirmation email using your custom template
  try {
    // For confirmation, you might want to create a new email type or use an existing one
    // Since you don't have a specific "password-reset-success" type, 
    // you could either:
    // 1. Create a new template in your email service
    // 2. Use the existing 'welcome-client' or 'approval' template with custom data
    // 3. Skip the confirmation email for now
    
    // Option 3: Skip for now since we don't have a template
    console.log('Password reset successful for user:', resetToken.user.email);
    
    // If you want to add a confirmation email later, you can add a new type to your email service:
    // 'password-reset-success': { ... }
    
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    // Don't throw error, password reset was successful
  }

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully',
  });
});