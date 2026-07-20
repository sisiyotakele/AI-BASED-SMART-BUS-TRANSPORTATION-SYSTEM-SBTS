import { Router } from 'express';
import { validateBody, validateParams } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createTerminalSchema, updateTerminalSchema, terminalIdParamSchema } from './terminals.validation';
import { createTerminal, listTerminals, getTerminal, updateTerminal, deleteTerminal } from './terminals.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.post('/', requirePermission('manage_terminals'), validateBody(createTerminalSchema), createTerminal);
router.get('/', requirePermission('view_terminals'), listTerminals);
router.get('/:id', requirePermission('view_terminals'), validateParams(terminalIdParamSchema), getTerminal);
router.patch('/:id', requirePermission('manage_terminals'), validateParams(terminalIdParamSchema), validateBody(updateTerminalSchema), updateTerminal);
router.delete('/:id', requirePermission('manage_terminals'), validateParams(terminalIdParamSchema), deleteTerminal);

export default router;
