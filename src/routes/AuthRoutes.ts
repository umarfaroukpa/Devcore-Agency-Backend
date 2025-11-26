import { Router } from 'express';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { asyncHandler, AppError } from '../middleware/ErrorHandler';

const router = Router();


// POST /api/auth/login - Login user
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // Find user with all necessary fields
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      isApproved: true,
      companyName: true,
      phone: true
    }
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 403);
  }

  // ⭐ Check approval status for DEVELOPER/ADMIN
  if (user.role !== 'CLIENT' && user.isApproved !== true) {
    return res.status(403).json({
      success: false,
      error: 'Your account is pending approval',
      needsApproval: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isApproved: user.isApproved
      }
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  // Success response
  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: userWithoutPassword
  });
}));

// POST /api/auth/signup - Register new user
router.post('/signup', asyncHandler(async (req: Request, res: Response) => {
  const { 
    name, email, password, phone, role, inviteCode,
    companyName, industry, position, skills, experience, 
    githubUsername, portfolio 
  } = req.body;

  // Validation
  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400);
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  // ⭐ Verify invite code for DEVELOPER/ADMIN
  if (role === 'DEVELOPER' || role === 'ADMIN') {
    if (!inviteCode) {
      throw new AppError('Invite code is required for this role', 400);
    }

    const invite = await prisma.inviteCode.findUnique({
      where: { code: inviteCode.toUpperCase() }
    });

    if (!invite) {
      throw new AppError('Invalid invite code', 400);
    }

    if (invite.used) {
      throw new AppError('This invite code has already been used', 400);
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new AppError('This invite code has expired', 400);
    }

    if (invite.role !== role) {
      throw new AppError(`This invite code is for ${invite.role} role only`, 400);
    }

    // Mark invite code as used
    await prisma.inviteCode.update({
      where: { code: inviteCode.toUpperCase() },
      data: {
        used: true,
        usedBy: email,
        usedAt: new Date()
      }
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Split name
  const [firstName, ...lastNameParts] = name.split(' ');
  const lastName = lastNameParts.join(' ');

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName: lastName || undefined,
      phone,
      role: role || 'CLIENT',
      companyName,
      industry,
      position,
      skills: skills ? JSON.stringify(skills) : undefined,
      experience,
      githubUsername,
      portfolio,
      isActive: true,
      isApproved: role === 'CLIENT' ? true : null // Clients auto-approved
    }
  });

  // Generate token (only for clients)
  let token = undefined;
  if (role === 'CLIENT') {
    token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
  }

  res.status(201).json({
    success: true,
    message: role === 'CLIENT' 
      ? 'Account created successfully' 
      : 'Application submitted. You will be notified once approved.',
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isApproved: user.isApproved
    }
  });
}));

// POST /api/auth/verify-invite - Verify invite code (public)
router.post('/verify-invite', asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    throw new AppError('Invite code is required', 400);
  }

  const inviteCode = await prisma.inviteCode.findUnique({
    where: { code: code.toUpperCase() }
  });

  if (!inviteCode) {
    throw new AppError('Invalid invite code', 404);
  }

  if (inviteCode.used) {
    throw new AppError('This invite code has already been used', 400);
  }

  if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
    throw new AppError('This invite code has expired', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Invite code is valid',
    data: {
      role: inviteCode.role
    }
  });
}));

export default router;