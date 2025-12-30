import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config'; 
import rateLimit from 'express-rate-limit';
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
import settingsRouter from './routes/SystemSettingsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRouter from './routes/ReportRoutes';
import forgotPasswordRoutes from './routes/ForgotPasswordRoutes';

const app = express();
const port = process.env.PORT || 10000;


// Set up to allowed origins for CORS
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'https://agency-frontend-snowy.vercel.app',
      'https://devcore-backend.onrender.com',
  
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log(' Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP'
});

app.use(cors(corsOptions));

// Middleware
app.use(apiLimiter, helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));



app.use(express.json()); 
app.use('/uploads', express.static('uploads'));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('🌐 Incoming Request:', {
    method: req.method,
    url: req.url,
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes); 
app.use('/api/admin', adminRouter); 
app.use('/api/admin/projects', projectRoutes); 
app.use('/api/users', userRoutes); 
app.use('/api/dev', developerRoutes); 
app.use('/api/clients', clientRoutes); 
app.use('/api/contact', contactRoutes); 
app.use('/api/services', servicesRoutes);
app.use('/api/admin/invite-codes', inviteCodeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin/settings', settingsRouter);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRouter);
app.use('/api/auth', forgotPasswordRoutes);


// Health check
app.get('/api/health', async (req, res) => {
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



// starting server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Set ✅' : '⚠️ NOT SET'}`);
});