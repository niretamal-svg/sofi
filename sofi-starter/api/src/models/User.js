import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password_hash: { type: String, required: true },
    rol: {
      type: String,
      enum: ['admin', 'reclutador', 'viewer'],
      default: 'admin'
    },
    empresa_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    activo: { type: Boolean, default: true },
    ultimo_acceso: { type: Date, default: null }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
