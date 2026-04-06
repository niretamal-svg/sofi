import { Router } from 'express';
import { getVacantes, createVacante, updateVacante } from '../controllers/vacanteController.js';
import { authenticateToken } from '../middlewares/authenticateToken.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getVacantes);
router.post('/', createVacante);
router.put('/:id', updateVacante);

export default router;