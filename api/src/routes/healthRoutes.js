import { Router } from 'express';
import { successResponse } from '../utils/apiResponse.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(successResponse({ status: 'ok', module: 'sofi-api' }));
});

export default router;
