import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export function setPrismaClient(client: PrismaClient) {
    prisma = client;
}

export async function getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
            role: {
                include: {
                    rolePermissions: {
                        include: {
                            permission: {
                                select: { permissionName: true },
                            },
                        },
                    },
                },
            },
        },
    });

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
