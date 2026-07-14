import { Request, Response, NextFunction } from 'express';
import { rbacService } from './rbac.service';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { createRoleSchema, updateRoleSchema, createPermissionSchema, attachPermissionSchema, attachPermissionsBulkSchema, assignRoleSchema, assignRolesBulkSchema } from './rbac.validation';
import { BadRequestError } from '../../utils/errors';

export class RbacController {
  // ROLES

  async listRoles(_req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await rbacService.getAllRoles(true, true);
      res.json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  }

  async getRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const role = await rbacService.getRoleById(id);
      res.json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }

  async createRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0].message);
      }

      const role = await rbacService.createRole({
        role_name: parsed.data.role_name,
        description: parsed.data.description,
        created_by: req.user?.id,
      });

      res.status(201).json({ success: true, data: role, message: 'Role created' });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = updateRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0].message);
      }

      const { id } = req.params;
      const role = await rbacService.updateRole(id, {
        role_name: parsed.data.role_name,
        description: parsed.data.description,
        updated_by: req.user?.id,
      });

      res.json({ success: true, data: role, message: 'Role updated' });
    } catch (error) {
      next(error);
    }
  }

  async deleteRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await rbacService.deleteRole(id, req.user?.id);
      res.json({ success: true, message: 'Role soft-deleted' });
    } catch (error) {
      next(error);
    }
  }

  // PERMISSIONS

  async listPermissions(_req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await rbacService.getAllPermissions();
      res.json({ success: true, data: permissions });
    } catch (error) {
      next(error);
    }
  }

  async createPermission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createPermissionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0].message);
      }

      const permission = await rbacService.createPermission({
        permission_name: parsed.data.permission_name,
        resource: parsed.data.resource,
        action: parsed.data.action,
        description: parsed.data.description,
        created_by: req.user?.id,
      });

      res.status(201).json({ success: true, data: permission });
    } catch (error) {
      next(error);
    }
  }

  async getRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const permissions = await rbacService.getRolePermissions(id);
      res.json({ success: true, data: permissions });
    } catch (error) {
      next(error);
    }
  }

  async attachPermission(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // role id

      // Support both single permission_id and bulk permission_ids
      if (req.body.permission_ids) {
        const parsedBulk = attachPermissionsBulkSchema.safeParse(req.body);
        if (!parsedBulk.success) {
          throw new BadRequestError(parsedBulk.error.issues[0].message);
        }
        const result = await rbacService.attachPermissionsBulk(id, parsedBulk.data.permission_ids, req.user?.id);
        return res.status(201).json({ success: true, data: result, message: `${result.attached} permissions attached` });
      } else {
        const parsed = attachPermissionSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new BadRequestError(parsed.error.issues[0].message);
        }
        const result = await rbacService.attachPermissionToRole(id, parsed.data.permission_id, req.user?.id);
        return res.status(201).json({ success: true, data: result, message: 'Permission attached' });
      }
    } catch (error) {
      next(error);
    }
  }

  async detachPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, permission_id } = req.params; // role id and permission id
      const result = await rbacService.detachPermissionFromRole(id, permission_id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  // USER ROLES

  async assignRoleToUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // user id

      if (req.body.role_ids) {
        const parsedBulk = assignRolesBulkSchema.safeParse(req.body);
        if (!parsedBulk.success) {
          throw new BadRequestError(parsedBulk.error.issues[0].message);
        }
        const result = await rbacService.assignRolesBulkToUser(id, parsedBulk.data.role_ids, req.user?.id);
        return res.status(201).json({ success: true, data: result, message: `${result.assigned} roles assigned` });
      } else {
        const parsed = assignRoleSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new BadRequestError(parsed.error.issues[0].message);
        }
        const result = await rbacService.assignRoleToUser(id, parsed.data.role_id, req.user?.id);
        return res.status(201).json({ success: true, data: result, message: 'Role assigned to user' });
      }
    } catch (error) {
      next(error);
    }
  }

  async removeRoleFromUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, role_id } = req.params; // user id and role id
      const result = await rbacService.removeRoleFromUser(id, role_id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getUserRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // user id
      const result = await rbacService.getUserRoles(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getMyRoles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new BadRequestError('No user in request');
      }
      const result = await rbacService.getUserRoles(req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const rbacController = new RbacController();
