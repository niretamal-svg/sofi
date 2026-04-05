import { errorResponse } from '../utils/apiResponse.js';

export const notFoundHandler = (req, res) => {
  return res.status(404).json(errorResponse('ERR_NOT_FOUND', 'Route not found'));
};

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const code = err.code || 'ERR_INTERNAL';
  const message = err.message || 'Internal server error';
  const details = err.details || [];

  return res.status(status).json(errorResponse(code, message, details));
};
