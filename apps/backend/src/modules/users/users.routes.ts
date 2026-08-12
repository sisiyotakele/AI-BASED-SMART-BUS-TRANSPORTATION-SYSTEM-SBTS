import { Router } from 'express';
import { usersController } from './users.controller';
import { validateBody } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac/rbac.middleware';
import { createUserSchema, updateUserSchema } from './users.schema';
import { auditMiddleware } from '@/modules/audit';
const router = Router();

router.use(authenticate);

router.get('/', requirePermission('users:read'), (req, res, next) => {
  usersController.getAllUsers(req, res).catch(next);
});

router.post(
  '/', 
  requirePermission('users:create'), 
  validateBody(createUserSchema), 
  auditMiddleware({
    action: 'CREATE',
    entityName: 'User',
    getDescription: (req) => `Created new system user: ${req.body.email || req.body.username || 'unknown'}`
  }),
  (req, res, next) => {
    usersController.createUser(req, res).catch(next);
  }
);

router.get('/:id', requirePermission('users:read'), (req, res, next) => {
  usersController.getUserById(req, res).catch(next);
});

router.patch(
  '/:id', 
  requirePermission('users:update'), 
  validateBody(updateUserSchema), 
  auditMiddleware({
    action: 'UPDATE',
    entityName: 'User',
    getEntityId: (req) => req.params.id,
    getDescription: () => `Updated user permissions or details`
  }),
  (req, res, next) => {
    usersController.updateUser(req, res).catch(next);
  }
);

router.delete(
  '/:id', 
  requirePermission('users:delete'), 
  auditMiddleware({
    action: 'DELETE',
    entityName: 'User',
    getEntityId: (req) => req.params.id,
    getDescription: () => `Deleted system user`
  }),
  (req, res, next) => {
    usersController.deleteUser(req, res).catch(next);
  }
);

export const usersRouter = router;
