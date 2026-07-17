import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { asyncHandler } from '@/common/asyncHandler';
import { successResponse } from '@/common/response';
import { AuthenticatedRequest } from '@/common/types';

export const register = asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.registerPassenger(req.body);
    return successResponse(res, { userId: user.id, user }, 'Registration successful', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const ipAddress = req.ip;

    const result = await authService.login(
        email,
        password,
        ipAddress
    );

    return successResponse(res, result, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshTokens(refreshToken);

    return successResponse(res, result, 'Tokens refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const ipAddress = req.ip;
    await authService.logout(refreshToken, ipAddress);
    return successResponse(res, null, 'Logout successful');
});

export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await authService.getMe(req.user!.userId);
    return successResponse(res, user, 'User profile retrieved');
});
