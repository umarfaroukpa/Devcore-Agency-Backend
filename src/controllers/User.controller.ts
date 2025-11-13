import { Request, Response } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';

// Extend the Request object to get user ID from the 'protect' middleware
interface AuthRequest extends Request { userId?: string; }

// GET /api/v1/users/me
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, firstName: true, email: true, role: true, createdAt: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        return res.status(200).json({ data: user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ error: 'Server error fetching user profile.' });
    }
};

// PATCH /api/v1/users/me
export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { name, email } = req.body;
    
    if (!name && !email) {
        return res.status(400).json({ error: 'Provide fields to update.' });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: { firstName: name, email },
            select: { id: true, firstName: true, email: true, role: true }
        });
        
        return res.status(200).json({ message: 'Profile updated successfully.', data: updatedUser });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email is already in use.' });
        }
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Server error updating profile.' });
    }
};

// PATCH /api/v1/users/updatePassword
export const updateMyPassword = async (req: AuthRequest, res: Response): Promise<Response> => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Provide current and new password.' });
    }

    try {
        // 1. Fetch user to get stored hash
        const user = await prisma.user.findUnique({ where: { id: req.userId } });

        if (!user) {
             // Should not happen if 'protect' middleware worked, but good practice.
            return res.status(404).json({ error: 'User not found.' });
        }

        // 2. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect current password.' });
        }

        // 3. Hash the new password
        const salt = await bcrypt.genSalt(10);
        const newHashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Update the database
        await prisma.user.update({
            where: { id: req.userId },
            data: { password: newHashedPassword }
        });
        
        return res.status(200).json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ error: 'Server error updating password.' });
    }
};