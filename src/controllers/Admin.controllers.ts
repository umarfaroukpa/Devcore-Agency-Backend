import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Get all users (Admin view)
export const getUsers = async (req: Request, res: Response): Promise<Response> => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, firstName: true, email: true, role: true, createdAt: true }
        });
        return res.status(200).json({ count: users.length, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: 'Server error while fetching users.' });
    }
};

// Delete a user
export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try {
        await prisma.user.delete({
            where: { id }
        });
        return res.status(204).json({ message: 'User successfully deleted.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ error: 'Server error while deleting user.' });
    }
};