import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Protected: Get all users with the 'client' role
export const getAllClients = async (req: Request, res: Response): Promise<Response> => {
    try {
        const clients = await prisma.user.findMany({
            where: { role: 'client' },
            select: { id: true, name: true, email: true, createdAt: true }
        });
        return res.status(200).json({ count: clients.length, data: clients });
    } catch (error) {
        console.error('Error fetching clients:', error);
        return res.status(500).json({ error: 'Server error while fetching clients.' });
    }
};

// Protected: Get specific client details
export const getClientDetails = async (req: Request, res: Response): Promise<Response> => {
    // Logic to fetch one client and perhaps their associated projects
    return res.status(501).json({ message: 'Get Client Details Not Implemented.' });
};

// Protected: Update a user's role
export const updateClientRole = async (req: Request, res: Response): Promise<Response> => {
    // Logic to update user role
    return res.status(501).json({ message: 'Update Client Role Not Implemented.' });
};