import { Router } from 'express';
import {
  getVacantes,
  createVacante,
  updateVacante,
  deleteVacante
} from '../controllers/vacanteController.js';

const router = Router();

router.get('/', getVacantes);
router.post('/', createVacante);
router.put('/:id', updateVacante);
router.delete('/:id', deleteVacante);

export default router;