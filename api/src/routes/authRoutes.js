import { Router } from 'express';
import { login, me, seedAdmin } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authenticateToken.js';

const router = Router();

router.post('/login', login);
router.post('/seed-admin', seedAdmin);
router.get('/me', authenticateToken, me);

export default router;
