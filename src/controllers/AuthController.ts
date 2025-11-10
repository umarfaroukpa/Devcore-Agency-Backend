import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { User } from '@prisma/client'; // Import the User type from Prisma client

// --- FUTURE: Install and import bcrypt and jwt ---
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';

export const signup = async (req: Request, res: Response): Promise<Response> => {
    // We expect email, password, name, and an optional role in the request body
    const { email, password, name, role } = req.body;
    
    // Simple validation (TypeScript helps with checking types later)
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    try {
        // 1. (Future Step: Hash the password using bcryptjs)
        // const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Create the new user in the database
        const newUser: User = await prisma.user.create({
            data: {
                email,
                password, // NOTE: This will be the HASHED password soon
                name,
                role: role || 'client',
            },
            // Select fields to return
            select: { id: true, email: true, name: true, role: true } 
        }) as User; // Cast to User type for clarity

        // 3. (Future Step: Generate a JWT token)

        return res.status(201).json({ 
            message: 'User registered successfully.', 
            user: newUser 
        });

    } catch (error: any) {
        // Handle unique email constraint error (Prisma specific error code)
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email is already in use.' });
        }
        console.error("Signup error:", error);
        return res.status(500).json({ error: 'Server error during registration.' });
    }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
    // Login logic will go here.
    return res.status(501).json({ message: 'Login endpoint not yet implemented.' });
};