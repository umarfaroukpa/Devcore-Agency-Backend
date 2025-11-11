import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config'; 
import authRoutes from './routes/AuthRoutes'; 
import adminRoutes from './routes/AdminRoutes'; 
import projectRoutes from './routes/ProjectsRoutes'; 
import userRoutes from './routes/UserRoutes';
import developerRoutes from './routes/DeveloperRoutes';
import clientRoutes from './routes/ClientRoutes';
import contactRoutes from './routes/ContactRoutes';
import servicesRoutes from './routes/ServicesRoutes';

const app = express();
const port = process.env.PORT || 4000;

// Set up allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000', 
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
app.use('/api/v1/auth', authRoutes); 
app.use('/api/v1/admin', adminRoutes); 
app.use('/api/v1/projects', projectRoutes); 
app.use('/api/v1/users', userRoutes); 
app.use('/api/v1/dev', developerRoutes); 
app.use('/api/v1/clients', clientRoutes); 
app.use('/api/v1/contact', contactRoutes); 
app.use('/api/v1/services', servicesRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// START SERVER
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});