import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        firstName?: string;
        lastName?: string;
        isActive: boolean;
        canApproveUsers: boolean;
        canDeleteUsers: boolean;
        canManageProjects: boolean;
        canAssignTasks: boolean;
        canViewAllProjects: boolean;
        userId: string; 
      };
    }
  }
}