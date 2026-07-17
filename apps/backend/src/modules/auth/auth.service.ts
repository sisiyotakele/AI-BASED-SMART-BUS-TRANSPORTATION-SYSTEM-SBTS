import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma/client.js';

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

export const loginUser = async (authData: { email: string; password: string }) => {
  const { email, password } = authData;

  // If Prisma client is available and DATABASE_URL is configured, use DB-backed auth
  if (prisma) {
    try {
      const user = await (prisma as any).user.findUnique({
        where: { email },
        include: { roles: { include: { role: true } } },
      });
      if (!user) throw new Error('Invalid email or password');

      const passwordHash = user.passwordHash || null;
      if (!passwordHash || !(await bcrypt.compare(password, passwordHash))) {
        throw new Error('Invalid email or password');
      }

      const roleName = user.roles?.[0]?.role?.name ?? 'user';
      const token = generateToken(user.id, roleName);

      return { user: { id: user.id, email: user.email, role: roleName }, token };
    } catch (err) {
      throw err;
    }
  }

  // Fallback: demo users for quick local development
  const demoUsers = [
    { email: 'admin@example.com', password: 'admin123', role: 'admin' },
    { email: 'driver@example.com', password: 'driver123', role: 'driver' },
    { email: 'passenger@example.com', password: 'passenger123', role: 'passenger' },
  ];

  const user = demoUsers.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) throw new Error('Invalid email or password');

  const token = generateToken(user.email, user.role);
  return { user: { email: user.email, role: user.role }, token };
};

export const registerUser = async (registerData: { email: string; password: string; name?: string; role?: string }) => {
  const { email, password, name, role } = registerData;

  // If Prisma is available, create the user in the database with a hashed password
  if (prisma) {
    try {
      const existing = await (prisma as any).user.findUnique({ where: { email } });
      if (existing) throw new Error('Email already in use');

      const passwordHash = await bcrypt.hash(password, 10);
      const roleName = role || 'user';

      let roleRecord = await (prisma as any).role.findUnique({ where: { name: roleName } });
      if (!roleRecord) {
        roleRecord = await (prisma as any).role.create({ data: { name: roleName } });
      }

      const createdUser = await (prisma as any).user.create({
        data: {
          email,
          fullName: name || undefined,
          passwordHash,
        },
      });

      await (prisma as any).userRole.create({
        data: {
          userId: createdUser.id,
          roleId: roleRecord.id,
        },
      });

      const token = generateToken(createdUser.id, roleName);
      return { user: { id: createdUser.id, email: createdUser.email, role: roleName }, token };
    } catch (err) {
      throw err;
    }
  }

  // Fallback: return a token for a non-persistent demo user
  const demo = { email, name: name || 'Demo User', role: role || 'user' };
  const token = generateToken(email, demo.role);
  return { user: demo, token };
};