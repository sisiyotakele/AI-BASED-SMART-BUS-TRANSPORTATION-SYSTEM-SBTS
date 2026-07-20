import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './types';
import { prisma } from '@/prisma/client';

/**
 * ⚠️ DEVELOPMENT ONLY — Remove once Auth module is built.
 * Simulates an authenticated admin user for testing RBAC endpoints.
 * Usage: add `devAuth` before `requirePermission` in routes.
 */
export async function devAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    // Look for the admin role
    const adminRole = await prisma.role.findFirst({
      where: { roleName: 'admin', deletedAt: null },
      include: {
        rolePermissions: {
          include: {
            permission: { select: { permissionName: true } },
          },
        },
      },
    });

    if (!adminRole) {
      return next(new Error('Admin role not found. Run seed first: npm run db:seed'));
    }

    req.user = {
      userId: '00000000-0000-0000-0000-000000000000', // placeholder
      email: 'dev@sbts.local',
      roles: [
        {
          roleId: adminRole.id,
          roleName: adminRole.roleName,
          permissions: adminRole.rolePermissions.map((rp: any) => rp.permission.permissionName),
        },
      ],
    };

    next();
  } catch (error) {
    next(error);
  }
}
