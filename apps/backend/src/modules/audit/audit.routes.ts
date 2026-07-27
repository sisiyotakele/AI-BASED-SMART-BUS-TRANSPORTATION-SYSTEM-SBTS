import { Router } from 'express';
import { auditController } from './audit.controller';
console.log('✅ Audit routes loaded');
const router = Router();

// Get all audit logs
router.get('/', auditController.getAllAuditLogs.bind(auditController));

// Search audit logs
router.get('/search', auditController.searchAuditLogs.bind(auditController));

// Get audit logs by user
router.get('/user/:userId', auditController.getAuditLogsByUser.bind(auditController));

// Get audit logs by entity
router.get('/entity/:entityName', auditController.getAuditLogsByEntity.bind(auditController));

// Get single audit log
router.get('/:id', auditController.getAuditLogById.bind(auditController));

export const auditRoutes = router;
export default router;