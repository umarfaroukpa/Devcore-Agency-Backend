import { Request, Response } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler, AppError } from '../middleware/ErrorHandler';

// Consistent JWT payload: always use { id, role }
const generateToken = (id: string, role: string) => {
  return jwt.sign(
    { id, role }, 
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/signup
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { 
    name, email, password, phone, role = 'CLIENT', inviteCode,
    companyName, industry, position, skills, experience, 
    githubUsername, portfolio 
  } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  // Invite code validation for restricted roles
  if (['DEVELOPER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    if (!inviteCode) {
      throw new AppError('Invite code is required for this role', 400);
    }

    const invite = await prisma.inviteCode.findUnique({
      where: { code: inviteCode.toUpperCase() }
    });

    if (!invite || invite.used || invite.role !== role || 
        (invite.expiresAt && invite.expiresAt < new Date())) {
      throw new AppError('Invalid or expired invite code', 400);
    }

    await prisma.inviteCode.update({
      where: { code: inviteCode.toUpperCase() },
      data: { used: true, usedBy: email.toLowerCase(), usedAt: new Date() }
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const [firstName, ...lastNameParts] = name.trim().split(' ');
  const lastName = lastNameParts.length > 0 ? lastNameParts.join(' ') : null;

  const permissions = {
    canApproveUsers: role === 'SUPER_ADMIN',
    canDeleteUsers: role === 'SUPER_ADMIN',
    canManageProjects: ['SUPER_ADMIN', 'ADMIN'].includes(role),
    canAssignTasks: ['SUPER_ADMIN', 'ADMIN'].includes(role),
    canViewAllProjects: role === 'SUPER_ADMIN'
  };

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role,
      companyName,
      industry,
      position,
      skills: skills ? JSON.stringify(skills) : undefined,
      experience,
      githubUsername,
      portfolio,
      isActive: true,
      isApproved: ['CLIENT', 'SUPER_ADMIN'].includes(role) ? true : null,
      ...permissions
    }
  });

  // Only issue token if user is auto-approved
  const token = ['CLIENT', 'SUPER_ADMIN'].includes(role)
    ? generateToken(user.id, user.role)
    : undefined;

  res.status(201).json({
    success: true,
    message: ['CLIENT', 'SUPER_ADMIN'].includes(role)
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
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide both email and password', 400);
  }

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
      industry: true,
      position: true,
      githubUsername: true,
      portfolio: true,
      experience: true,
      canApproveUsers: true,
      canDeleteUsers: true,
      canManageProjects: true,
      canAssignTasks: true,
      canViewAllProjects: true
    }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 403);
  }

  if (!['CLIENT', 'SUPER_ADMIN'].includes(user.role) && user.isApproved !== true) {
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

  const token = generateToken(user.id, user.role);

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: userWithoutPassword
  });
});

// POST /api/auth/verify-invite
export const verifyInviteCode = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    throw new AppError('Invite code is required', 400);
  }

  const invite = await prisma.inviteCode.findUnique({
    where: { code: code.toUpperCase() }
  });

  if (!invite || invite.used || 
      (invite.expiresAt && invite.expiresAt < new Date())) {
    throw new AppError('Invalid, used, or expired invite code', 400);
  }

  res.json({
    success: true,
    message: 'Invite code is valid',
    data: { role: invite.role }
  });
});