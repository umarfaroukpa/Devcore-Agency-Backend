import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { User } from '@prisma/client'; 
import bcrypt from 'bcryptjs'; 
import jwt from 'jsonwebtoken'; 

//Helper function to generate JWT
const generateToken = (userId: string, role: string) => {
    return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET as string, {
        expiresIn: '1d', // Token expires in 1 day
    });
};

//signup controllers
export const signup = async (req: Request, res: Response): Promise<Response> => {
    const { email, password, name, role } = req.body;
    
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    try {
        //HASH PASSWORD ---
        //Generate a salt and hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        

        const newUser: User = await prisma.user.create({
            data: {
                email,
                password: hashedPassword, 
                name,
                role: role || 'client',
            },
            select: { id: true, email: true, name: true, role: true } 
        }) as User; 

        //GENERATE TOKEN
        const token = generateToken(newUser.id, newUser.role);
        

        return res.status(201).json({ 
            message: 'User registered successfully.', 
            user: newUser,
            // <-- Send the token back to the client
            token: token 
        });

    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email is already in use.' });
        }
        console.error("Signup error:", error);
        return res.status(500).json({ error: 'Server error during registration.' });
    }
};

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
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            token: token,
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: 'Server error during login.' });
    }
};