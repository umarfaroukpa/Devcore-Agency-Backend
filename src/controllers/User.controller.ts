import { Request, Response } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';


const asyncHandler = (fn: any) => (req: Request, res: Response, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);
    

interface AuthRequest extends Request { 
    userId?: string; 
}


// GET /api/v1/users/me
export const getMyProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.userId;
        if (!userId) {
             // Middleware failed to attach ID. This would cause a crash without the try/catch.
             return res.status(401).json({ error: 'Authentication required. User ID missing.' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                id: true, 
                firstName: true, 
                lastName: true, 
                email: true, 
                role: true, 
                createdAt: true,
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        return res.status(200).json({ data: user });
    } catch (error: any) {
        console.error('Error fetching profile:', error.message);
        // Using a centralized error handler (via next(error)) 
        return res.status(500).json({ error: 'Server error fetching user profile.' });
    }
});


// PATCH /api/v1/users/me
export const updateMyProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<Response> => {
    // Assuming the client sends firstName and email separately.
    const { firstName, email } = req.body; 
    
    if (!firstName && !email) {
        return res.status(400).json({ error: 'Provide fields to update.' });
    }
    
    // Check if the user is trying to update the email to the one they already have
    if (email) {
        const currentUser = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { email: true }
        });
        if (currentUser && currentUser.email === email) {
            // If they are trying to update to their current email, skip database update to prevent P2002 error
             return res.status(200).json({ message: 'Profile updated successfully (no changes made to email).', data: currentUser });
        }
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.userId },
            data: { 
                firstName: firstName, 
                email: email
            }, 
            select: { id: true, firstName: true, email: true, role: true }
        });
        
        return res.status(200).json({ message: 'Profile updated successfully.', data: updatedUser });
    } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(409).json({ error: 'Email is already in use.' });
        }
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Server error updating profile.' });
    }
});

// PATCH /api/v1/users/updatePassword
export const updateMyPassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<Response> => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Provide current and new password.' });
    }
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required. User ID missing.' });
    }


    try {
        // 1. Fetch user to get stored hash and ensure the user exists
        const user = await prisma.user.findUnique({ 
            where: { id: userId },
            // MUST select the password field explicitly for comparison
            select: { id: true, password: true } 
        });

        if (!user) {
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
            where: { id: userId },
            data: { password: newHashedPassword }
        });
        
        // Note: You should generally issue a new JWT or revoke old ones upon password change.
        
        return res.status(200).json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ error: 'Server error updating password.' });
    }
});