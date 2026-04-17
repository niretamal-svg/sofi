import { Router } from 'express';
import authRoutes from './authRoutes.js';
import vacanteRoutes from './vacanteRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vacantes', vacanteRoutes);

export default router;