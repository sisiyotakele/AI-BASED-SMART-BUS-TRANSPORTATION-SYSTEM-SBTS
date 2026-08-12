import { prisma } from '@/prisma/client';
import { Prisma } from '@prisma/client';

export class UsersRepository {
  async findMany(args: Prisma.UserFindManyArgs) {
    return prisma.user.findMany(args);
  }

  async count(args: Prisma.UserCountArgs) {
    return prisma.user.count(args);
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async delete(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    
    // Mutate the unique identifier fields so they are freed up for new users
    const timestamp = Date.now();
    
    return prisma.user.update({
      where: { id },
      data: {
        email: `${user.email}.deleted.${timestamp}`,
        phone: `${user.phone}.deleted.${timestamp}`,
        isActive: false,
        deletedAt: new Date()
      }
    });
  }
}

export const usersRepository = new UsersRepository();
