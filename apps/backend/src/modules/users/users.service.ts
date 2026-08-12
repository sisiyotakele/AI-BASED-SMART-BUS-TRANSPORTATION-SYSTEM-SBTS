import { usersRepository } from './users.repository';
import { prisma } from '@/prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '@/common/errors';
import { parsePaginationParams, createPaginatedResponse } from '@/common/pagination';

export class UsersService {
  async findAll(query: any = {}) {
    const { search, isActive } = query;
    const { page, limit, skip, take } = parsePaginationParams(query);
    
    let where: any = { deletedAt: null };
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [data, total] = await Promise.all([
      usersRepository.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        }
      }),
      usersRepository.count({ where })
    ]);

    // Format the response to map userRoles to simple role strings matching UI expectations
    const formattedData = data.map(user => ({
      ...user,
      passwordHash: undefined, // ensure password never leaks
      roles: ((user as any).userRoles || []).map((ur: any) => ur.role.roleName)
    }));

    return createPaginatedResponse(formattedData, page, limit, total);
  }

  async findById(id: string) {
    const user = await usersRepository.findById(id);
    if (!user || user.deletedAt) throw new AppError('User not found', 404);
    
    const { passwordHash, ...safeUser } = user;
    return {
      ...safeUser,
      roles: ((user as any).userRoles || []).map((ur: any) => ur.role.roleName)
    };
  }

  async create(data: any, createdById?: string) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone }
        ]
      }
    });

    if (existingUser) {
      throw new AppError('User with this email or phone already exists', 409);
    }

    const defaultPassword = data.password || 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    let userRolesCreate = undefined;
    if (data.roles && Array.isArray(data.roles) && data.roles.length > 0) {
      // Assuming data.roles contains roleNames or roleIds
      // Separate UUIDs and Names to prevent Prisma throwing on invalid UUID
      const uuids = data.roles.filter((r: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r));
      const names = data.roles.filter((r: string) => !uuids.includes(r));
      
      const rolesToAssign = await prisma.role.findMany({
        where: {
          OR: [
            ...(uuids.length > 0 ? [{ id: { in: uuids } }] : []),
            ...(names.length > 0 ? [{ roleName: { in: names } }] : [])
          ]
        }
      });
      userRolesCreate = rolesToAssign.map(r => ({
        role: { connect: { id: r.id } },
        createdBy: createdById ? { connect: { id: createdById } } : undefined
      }));
    }

    const user = await usersRepository.create({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      isActive: data.isActive ?? true,
      department: data.department,
      createdBy: createdById ? { connect: { id: createdById } } : undefined,
      userRoles: userRolesCreate ? { create: userRolesCreate } : undefined
    });

    // Strip password
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async update(id: string, data: any, updatedById?: string) {
    const user = await usersRepository.findById(id);
    if (!user || user.deletedAt) throw new AppError('User not found', 404);

    if (data.email || data.phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email },
            { phone: data.phone }
          ],
          id: { not: id }
        }
      });
      if (existingUser) throw new AppError('Email or phone already in use', 409);
    }

    const updateData: any = {
      ...data,
      updatedById
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
      delete updateData.password;
    }

    if (data.roles && Array.isArray(data.roles)) {
      const uuids = data.roles.filter((r: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r));
      const names = data.roles.filter((r: string) => !uuids.includes(r));
      
      const rolesToAssign = await prisma.role.findMany({
        where: {
          OR: [
            ...(uuids.length > 0 ? [{ id: { in: uuids } }] : []),
            ...(names.length > 0 ? [{ roleName: { in: names } }] : [])
          ]
        }
      });
      const newRoleIds = rolesToAssign.map(r => r.id);
      
      // Update by wiping old and setting new (simplified)
      await prisma.userRole.deleteMany({ where: { userId: id } });
      
      if (newRoleIds.length > 0) {
        await prisma.userRole.createMany({
          data: newRoleIds.map(roleId => ({
            userId: id,
            roleId,
            createdById: updatedById
          }))
        });
      }
    }
    delete updateData.roles;

    const updated = await usersRepository.update(id, updateData);
    
    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  async delete(id: string, deletedById?: string) {
    const user = await usersRepository.findById(id);
    if (!user || user.deletedAt) throw new AppError('User not found', 404);

    await usersRepository.delete(id);
    if (deletedById) {
       await prisma.user.update({
         where: { id },
         data: { deletedById }
       });
    }
    return true;
  }
}

export const usersService = new UsersService();
