import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Public: Handle incoming contact form data
export const submitContactForm = async (req: Request, res: Response): Promise<Response> => {
    const { name, email, message } = req.body;
    
    if (!email || !message) {
        return res.status(400).json({ error: 'Email and message are required.' });
    }

    try {
        // Note: You must create a 'ContactSubmission' model in your schema.prisma first!
        await (prisma as any).contactSubmission.create({
            data: { name, email, message }
        });

        // Future idea: Send an email notification to the admin here

        return res.status(201).json({ message: 'Contact form submitted successfully!' });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        return res.status(500).json({ error: 'Failed to process submission.' });
    }
};

// Protected: Retrieve all contact form submissions
export const getSubmissions = async (req: Request, res: Response): Promise<Response> => {
    // Logic to fetch all submissions from the database
    return res.status(501).json({ message: 'Get Submissions Not Implemented.' });
};