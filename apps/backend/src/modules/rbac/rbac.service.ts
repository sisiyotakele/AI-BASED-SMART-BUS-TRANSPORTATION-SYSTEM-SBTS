/**
 * RBAC Service - Main Entry Point
 * 
 * This file re-exports functions from specialized service modules.
 * Split into smaller files to maintain < 350 line limit per file.
 */

import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/prisma/client';

// Import from split service files
import * as roleService from './services/rbac.role.service';
import * as permissionService from './services/rbac.permission.service';
import * as assignmentService from './services/rbac.assignment.service';
import * as checkService from './services/rbac.check.service';

// Initialize prisma client for all sub-services
roleService.setPrismaClient(defaultPrisma);
permissionService.setPrismaClient(defaultPrisma);
assignmentService.setPrismaClient(defaultPrisma);
checkService.setPrismaClient(defaultPrisma);

// Allow prisma client to be injected for testing
export function setPrismaClient(client: PrismaClient) {
  roleService.setPrismaClient(client);
  permissionService.setPrismaClient(client);
  assignmentService.setPrismaClient(client);
  checkService.setPrismaClient(client);
}

// Re-export all functions from specialized services
export * from './services/rbac.role.service';
export * from './services/rbac.permission.service';
export * from './services/rbac.assignment.service';
export * from './services/rbac.check.service';
