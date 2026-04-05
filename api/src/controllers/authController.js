import { loginUser, seedAdminUser } from '../services/authService.js';
import { successResponse } from '../utils/apiResponse.js';

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    return res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const seedAdmin = async (req, res, next) => {
  try {
    const user = await seedAdminUser();
    return res.status(201).json(
      successResponse({
        id: user._id,
        email: user.email,
        password_hint: 'Admin12345*'
      })
    );
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res) => {
  return res.json(successResponse({ user: req.user }));
};
