#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  const prisma = new PrismaClient();

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';

  // Hash the password
  const hashed = await bcrypt.hash(password, 10);

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('User already exists:', existing.email);
    await prisma.$disconnect();
    return;
  }

  // Ensure admin role exists
  let role = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (!role) {
    role = await prisma.role.create({ data: { name: 'admin', description: 'Administrator' } });
    console.log('Created role:', role.name);
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashed,
      fullName: 'Seed Admin'
    }
  });

  // Link user to role
  await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });

  console.log('Created admin user:', user.email);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
