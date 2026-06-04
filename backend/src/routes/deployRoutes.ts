import { Router } from 'express';
import { startDeployment, getDeploymentStatus, getHistoryLogs, downloadLogsFile } from '../controllers/deployController';
import { authenticateToken, requireSalesforce } from '../middleware/auth';

const router = Router();
const sf = [authenticateToken, requireSalesforce];

router.post('/', ...sf, startDeployment);
router.get('/status', ...sf, getDeploymentStatus);
router.get('/audit-logs', ...sf, getHistoryLogs);
router.get('/audit-logs/:id/logs', ...sf, downloadLogsFile);

// Backwards-compatible route
router.get('/deployment-history', ...sf, getHistoryLogs);

export default router;
