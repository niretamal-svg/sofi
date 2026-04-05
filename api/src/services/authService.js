import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginUser = async (payload) => {
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    const err = new Error('Validation error');
    err.status = 400;
    err.code = 'ERR_VALIDATION';
    err.details = parsed.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    throw err;
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email: email.toLowerCase(), activo: true });

  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    err.code = 'ERR_INVALID_CREDENTIALS';
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    err.code = 'ERR_INVALID_CREDENTIALS';
    throw err;
  }

  user.ultimo_acceso = new Date();
  await user.save();

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      rol: user.rol,
      empresa_id: user.empresa_id
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    access_token: token,
    user: {
      id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol
    }
  };
};

export const seedAdminUser = async () => {
  const existing = await User.findOne({ email: 'admin@sofi.local' });
  if (existing) return existing;

  const password_hash = await bcrypt.hash('Admin12345*', env.BCRYPT_ROUNDS);
  const user = await User.create({
    nombre: 'Administrador SOFI',
    email: 'admin@sofi.local',
    password_hash,
    rol: 'admin',
    activo: true
  });

  return user;
};
