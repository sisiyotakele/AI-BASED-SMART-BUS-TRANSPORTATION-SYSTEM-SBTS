import { PrismaClient } from '@prisma/client';
import * as repository from './rbac.check.repository';

export function setPrismaClient(client: PrismaClient) {
    repository.setPrismaClient(client);
}

export async function getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await repository.findUserRolesWithPermissions(userId);

    const permissionSet = new Set<string>();
    for (const ur of userRoles as any[]) {
        for (const rp of ur.role.rolePermissions as any[]) {
            permissionSet.add(rp.permission.permissionName as string);
        }
    }

    return Array.from(permissionSet);
}

export async function userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    const permissions = await getUserPermissions(userId);
    return permissions.includes(permissionName);
}
