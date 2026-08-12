import { Request, Response } from 'express';
import { usersService } from './users.service';
import { successResponse } from '@/common/response';
import { AuthenticatedRequest } from '@/common/types';

export class UsersController {
  async getAllUsers(req: Request, res: Response) {
    const data = await usersService.findAll(req.query);
    return successResponse(res, data.data, 'Users retrieved successfully', 200, data.meta);
  }

  async getUserById(req: Request, res: Response) {
    const data = await usersService.findById(req.params.id);
    return successResponse(res, data, 'User retrieved successfully');
  }

  async createUser(req: AuthenticatedRequest, res: Response) {
    const data = await usersService.create(req.body, req.user?.userId);
    return successResponse(res, data, 'User created successfully', 201);
  }

  async updateUser(req: AuthenticatedRequest, res: Response) {
    const data = await usersService.update(req.params.id, req.body, req.user?.userId);
    return successResponse(res, data, 'User updated successfully');
  }

  async deleteUser(req: AuthenticatedRequest, res: Response) {
    await usersService.delete(req.params.id, req.user?.userId);
    return successResponse(res, null, 'User deleted successfully');
  }
}

export const usersController = new UsersController();
