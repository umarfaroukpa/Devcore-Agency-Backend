import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { User } from '@prisma/client'; 
import bcrypt from 'bcryptjs'; 
import jwt from 'jsonwebtoken'; 
import { asyncHandler, AppError } from '../middleware/ErrorHandler';

//Helper function to generate JWT
const generateToken = (userId: string, role: string) => {
    return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET as string, {
        expiresIn: '1d', // Token expires in 1 day
    });
};

//signup controllers
export const signup = asyncHandler(async (req: Request, res: Response) => {
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

  // ⭐ VERIFY INVITE CODE FOR DEVELOPER/ADMIN
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

  // Split name into first and last
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

  res.status(201).json({
    success: true,
    message: role === 'CLIENT' 
      ? 'Account created successfully' 
      : 'Application submitted. You will be notified once approved.',
    token: role === 'CLIENT' ? token : undefined,
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

//login controllers 
export const login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    try {
        // 1. Find the user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // 2. Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // 3. Generate Token
        const token = generateToken(user.id, user.role);

        // 4. Successful Login response
        return res.status(200).json({
            message: 'Login successful.',
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
            token: token,
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: 'Server error during login.' });
    }
};

