import { Router } from 'express';
import { getPackages, createOrder, verifyPayment, getTokenHistory } from '../controllers/tokenController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/packages', getPackages);
router.post('/order', authMiddleware, createOrder);
router.post('/verify', authMiddleware, verifyPayment);
router.get('/history', authMiddleware, getTokenHistory);

export default router;