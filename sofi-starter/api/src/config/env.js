import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/sofi_db',
  JWT_SECRET: process.env.JWT_SECRET || 'change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 12),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173'
};
