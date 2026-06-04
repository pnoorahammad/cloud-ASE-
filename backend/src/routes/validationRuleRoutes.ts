import { Router } from 'express';
import { getValidationRules, getValidationRuleDetail, toggleRule, bulkToggleRules, getPendingForUser, deletePending } from '../controllers/validationRuleController';
import { authenticateToken, requireSalesforce } from '../middleware/auth';

const router = Router();
const sf = [authenticateToken, requireSalesforce];

// Order matters: specific routes must come before parameterized routes
router.get('/', ...sf, getValidationRules);
router.get('/pending', ...sf, getPendingForUser);
router.delete('/pending/:id', ...sf, deletePending);
router.put('/bulk', ...sf, bulkToggleRules);
router.put('/:id', ...sf, toggleRule);
router.get('/:id', ...sf, getValidationRuleDetail);

export default router;
