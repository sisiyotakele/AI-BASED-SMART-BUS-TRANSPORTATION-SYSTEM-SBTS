import { Request } from 'express';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: {
    roleId: string;
    roleName: string;
    permissions: string[]; // permission names
  }[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
