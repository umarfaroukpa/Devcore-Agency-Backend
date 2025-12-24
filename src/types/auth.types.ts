import { Request } from 'express';

export interface AuthUser {
  id: string;
  userId: string;
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
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}