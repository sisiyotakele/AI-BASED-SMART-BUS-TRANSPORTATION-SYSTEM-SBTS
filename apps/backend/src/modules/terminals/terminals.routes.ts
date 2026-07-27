import { Router } from 'express';
import { validateBody, validateParams } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createTerminalSchema, updateTerminalSchema, terminalIdParamSchema } from './terminals.validation';
import { createTerminal, listTerminals, getTerminal, updateTerminal, deleteTerminal } from './terminals.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/terminals:
 *   post:
 *     summary: Create a new terminal
 *     tags: [Terminals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - terminalName
 *               - address
 *               - latitude
 *               - longitude
 *             properties:
 *               terminalName:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *                 format: double
 *               longitude:
 *                 type: number
 *                 format: double
 *               capacity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Terminal created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Terminal name already exists
 *       500:
 *         description: Server error
 */
router.post('/', requirePermission('manage_terminals'), validateBody(createTerminalSchema), createTerminal);

/**
 * @swagger
 * /api/v1/terminals:
 *   get:
 *     summary: List all terminals
 *     tags: [Terminals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or address
 *     responses:
 *       200:
 *         description: List of terminals
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/', requirePermission('view_terminals'), listTerminals);

/**
 * @swagger
 * /api/v1/terminals/{id}:
 *   get:
 *     summary: Get terminal by ID
 *     tags: [Terminals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Terminal ID
 *     responses:
 *       200:
 *         description: Terminal details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Terminal not found
 *       500:
 *         description: Server error
 */
router.get('/:id', requirePermission('view_terminals'), validateParams(terminalIdParamSchema), getTerminal);

/**
 * @swagger
 * /api/v1/terminals/{id}:
 *   patch:
 *     summary: Update terminal
 *     tags: [Terminals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Terminal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               terminalName:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               capacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Terminal updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Terminal not found
 *       409:
 *         description: Terminal name already exists
 *       500:
 *         description: Server error
 */
router.patch('/:id', requirePermission('manage_terminals'), validateParams(terminalIdParamSchema), validateBody(updateTerminalSchema), updateTerminal);

/**
 * @swagger
 * /api/v1/terminals/{id}:
 *   delete:
 *     summary: Delete terminal (soft delete)
 *     tags: [Terminals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Terminal ID
 *     responses:
 *       200:
 *         description: Terminal deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Terminal not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', requirePermission('manage_terminals'), validateParams(terminalIdParamSchema), deleteTerminal);

export default router;
