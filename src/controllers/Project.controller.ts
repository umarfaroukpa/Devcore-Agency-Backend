import { Request, Response } from 'express';
import prisma from '../config/prisma';

interface AuthRequest extends Request { userId?: string; userRole?: string; }

// Get projects for the logged-in client
export const getMyProjects = async (req: AuthRequest, res: Response): Promise<Response> => {
    const clientId = req.userId;
    try {
        const projects = await prisma.project.findMany({
            where: { clientId: clientId },
            // Include related tasks, for example
            include: { tasks: true } 
        });
        return res.status(200).json({ data: projects });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Could not fetch projects.' });
    }
};

// Create a new project (Admin/Manager only)
export const createProject = async (req: Request, res: Response): Promise<Response> => {
    // Logic to create a project, assign client, etc.
    return res.status(501).json({ message: 'Create Project Not Implemented.' });
};

// Update project status (Admin/Manager only)
export const updateProjectStatus = async (req: Request, res: Response): Promise<Response> => {
    // Logic to update project status
    return res.status(501).json({ message: 'Update Project Status Not Implemented.' });
};