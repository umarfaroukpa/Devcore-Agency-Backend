import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Public: Get list of services offered
export const getPublicServices = async (req: Request, res: Response): Promise<Response> => {
    // Note: You must create a 'Service' model in your schema.prisma first!
    try {
        const services = await prisma.service.findMany({
            where: { isActive: true }, // Only show active services to the public
            select: { id: true, title: true, description: true }
        });
        return res.status(200).json({ data: services });
    } catch (error) {
        console.error('Error fetching services:', error);
        return res.status(500).json({ error: 'Server error fetching services.' });
    }
};

// Protected: Create a new service (Admin/Manager)
export const createService = async (req: Request, res: Response): Promise<Response> => {
    // Logic to save a new service to the database
    return res.status(501).json({ message: 'Create Service Not Implemented.' });
};

// Protected: Update an existing service (Admin/Manager)
export const updateService = async (req: Request, res: Response): Promise<Response> => {
    // Logic to update service details
    return res.status(501).json({ message: 'Update Service Not Implemented.' });
};