import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config'; 
import helmet from 'helmet';
import prisma from './config/prisma';
import {errorHandler, notFoundHandler}  from './middleware/ErrorHandler';
import authRoutes from './routes/AuthRoutes'; 
import adminRouter from './routes/AdminRoutes';
import taskRoutes from './routes/TaskRoutes';
import projectRoutes from './routes/ProjectsRoutes'; 
import userRoutes from './routes/UserRoutes';
import developerRoutes from './routes/DeveloperRoutes';
import clientRoutes from './routes/ClientRoutes';
import contactRoutes from './routes/ContactRoutes';
import servicesRoutes from './routes/ServicesRoutes';
import inviteCodeRoutes from './routes/InviteCode.routes';
import { time, timeStamp } from 'console';

const app = express();
const port = process.env.PORT || 5000;


// Set up allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:5000', 
];


// Middleware
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); 

app.use('/uploads', express.static('uploads'));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('🌐 Incoming Request:', {
    method: req.method,
    url: req.url,
    // Note: If req.body is defined here, the parser worked.
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes); 
app.use('/api/admin', adminRouter); 
app.use('/api/projects', projectRoutes); 
app.use('/api/users', userRoutes); 
app.use('/api/dev', developerRoutes); 
app.use('/api/clients', clientRoutes); 
app.use('/api/contact', contactRoutes); 
app.use('/api/services', servicesRoutes);
app.use('/api/admin/invite-codes', inviteCodeRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`; 
    res.json({ 
      status: 'OK', 
      database: 'connected', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});


// 404 Handler
app.use(notFoundHandler);

// Error handling
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);


// START SERVER
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Set ✅' : '⚠️ NOT SET'}`);
});