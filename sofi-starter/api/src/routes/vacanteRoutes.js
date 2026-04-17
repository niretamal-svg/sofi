import { Router } from 'express';
import {
  getVacantes,
  createVacante,
  updateVacante,
  deleteVacante
} from '../controllers/vacanteController.js';

import { authenticateToken } from '../middlewares/authenticateToken.js';

const router = Router();

router.get('/', authenticateToken, getVacantes);
router.post('/', authenticateToken, createVacante);
router.put('/:id', authenticateToken, updateVacante);
router.delete('/:id', authenticateToken, deleteVacante);

export default router;