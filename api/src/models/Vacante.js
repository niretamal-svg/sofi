import mongoose from 'mongoose';

const vacanteSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    empresa: {
      type: String,
      required: true,
      trim: true,
    },
    ubicacion: {
      type: String,
      required: true,
      trim: true,
    },
    modalidad: {
      type: String,
      enum: ['Presencial', 'Hibrido', 'Remoto'],
      default: 'Presencial',
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    salario: {
      type: Number,
      required: true,
      min: 0,
    },
    estado: {
      type: String,
      enum: ['Activa', 'Pausada', 'Cerrada'],
      default: 'Activa',
    },
    creadaPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Vacante = mongoose.model('Vacante', vacanteSchema);