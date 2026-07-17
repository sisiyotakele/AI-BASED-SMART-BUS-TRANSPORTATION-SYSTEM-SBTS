import { prismaTest, resetDatabase } from '@/common/test-utils/test-db';
import * as rbacService from '@/modules/rbac/rbac.service';
import { ConflictError, NotFoundError } from '@/common/errors';

describe('RBAC Service', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('createRole', () => {
    it('should create a role with lowercase name', async () => {
      const role = await rbacService.createRole({ roleName: 'Supervisor', description: 'Shift supervisor' });
      expect(role.roleName).toBe('supervisor');
      expect(role.description).toBe('Shift supervisor');
    });

    it('should throw CONFLICT on duplicate role name', async () => {
      await rbacService.createRole({ roleName: 'supervisor' });
      await expect(rbacService.createRole({ roleName: 'supervisor' }))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('updateRole', () => {
    it('should update role description', async () => {
      const role = await rbacService.createRole({ roleName: 'editor' });
      const updated = await rbacService.updateRole(role.id, { description: 'Content editor' });
      expect(updated.description).toBe('Content editor');
    });

    it('should throw NOT_FOUND for non-existent role', async () => {
      await expect(rbacService.updateRole('00000000-0000-0000-0000-000000000000', { roleName: 'test' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteRole', () => {
    it('should soft-delete a role', async () => {
      const role = await rbacService.createRole({ roleName: 'temp' });
      await rbacService.deleteRole(role.id);
      const found = await prismaTest.role.findFirst({ where: { id: role.id, deletedAt: null } });
      expect(found).toBeNull();
    });

    it('should block deletion if role has users', async () => {
      const role = await rbacService.createRole({ roleName: 'driver' });
      await prismaTest.user.create({
        data: {
          fullName: 'Test',
          email: 'test@test.com',
          phone: '+251911111111',
          passwordHash: 'hash',
          userRoles: { create: { roleId: role.id } },
        },
      });
      await expect(rbacService.deleteRole(role.id))
        .rejects.toThrow('Cannot delete role that is assigned to users');
    });
  });

  describe('assignPermissionToRole', () => {
    it('should attach permission to role', async () => {
      const role = await rbacService.createRole({ roleName: 'tester' });
      const perm = await prismaTest.permission.create({
        data: { permissionName: 'test_perm', resource: 'test', action: 'read' },
      });
      const assignment = await rbacService.assignPermissionToRole(role.id, { permissionId: perm.id });
      expect(assignment.roleId).toBe(role.id);
      expect(assignment.permissionId).toBe(perm.id);
    });

    it('should throw CONFLICT on duplicate assignment', async () => {
      const role = await rbacService.createRole({ roleName: 'tester' });
      const perm = await prismaTest.permission.create({
        data: { permissionName: 'test_perm', resource: 'test', action: 'read' },
      });
      await rbacService.assignPermissionToRole(role.id, { permissionId: perm.id });
      await expect(rbacService.assignPermissionToRole(role.id, { permissionId: perm.id }))
        .rejects.toThrow('Permission already assigned');
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user', async () => {
      const role = await rbacService.createRole({ roleName: 'tester' });
      const user = await prismaTest.user.create({
        data: { fullName: 'Test', email: 't@test.com', phone: '+251911111112', passwordHash: 'hash' },
      });
      const assignment = await rbacService.assignRoleToUser(user.id, { roleId: role.id });
      expect(assignment.roleId).toBe(role.id);
      expect(assignment.userId).toBe(user.id);
    });

    it('should throw CONFLICT on duplicate user-role', async () => {
      const role = await rbacService.createRole({ roleName: 'tester' });
      const user = await prismaTest.user.create({
        data: { fullName: 'Test', email: 't@test.com', phone: '+251911111113', passwordHash: 'hash' },
      });
      await rbacService.assignRoleToUser(user.id, { roleId: role.id });
      await expect(rbacService.assignRoleToUser(user.id, { roleId: role.id }))
        .rejects.toThrow('Role already assigned');
    });
  });

  describe('getUserPermissions', () => {
    it('should flatten permissions across all roles', async () => {
      const role1 = await rbacService.createRole({ roleName: 'r1' });
      const role2 = await rbacService.createRole({ roleName: 'r2' });
      const p1 = await prismaTest.permission.create({ data: { permissionName: 'p1', resource: 'r', action: 'a' } });
      const p2 = await prismaTest.permission.create({ data: { permissionName: 'p2', resource: 'r', action: 'a' } });
      await prismaTest.rolePermission.create({ data: { roleId: role1.id, permissionId: p1.id } });
      await prismaTest.rolePermission.create({ data: { roleId: role2.id, permissionId: p2.id } });

      const user = await prismaTest.user.create({
        data: {
          fullName: 'Test',
          email: 'u@test.com',
          phone: '+251911111114',
          passwordHash: 'hash',
          userRoles: {
            create: [{ roleId: role1.id }, { roleId: role2.id }],
          },
        },
      });

      const perms = await rbacService.getUserPermissions(user.id);
      expect(perms).toContain('p1');
      expect(perms).toContain('p2');
    });
  });
});
