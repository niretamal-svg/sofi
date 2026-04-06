import { Vacante } from '../models/Vacante.js';

export async function getVacantes(req, res, next) {
  try {
    const vacantes = await Vacante.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: vacantes,
      meta: {
        total: vacantes.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createVacante(req, res, next) {
  try {
    const { titulo, empresa, ubicacion, modalidad, descripcion, salario, estado } = req.body;

    if (!titulo || !empresa || !ubicacion || !descripcion || salario === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ERR_VALIDATION',
          message: 'Faltan campos obligatorios',
          details: [
            'titulo, empresa, ubicacion, descripcion y salario son obligatorios',
          ],
        },
      });
    }

   const vacante = await Vacante.create({
  titulo,
  empresa,
  ubicacion,
  modalidad,
  descripcion,
  salario,
  estado,
  creadaPor: req.user.id || req.user._id || req.user.sub,
});

    return res.status(201).json({
      success: true,
      data: vacante,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateVacante(req, res, next) {
  try {
    const { id } = req.params;

    const vacante = await Vacante.findById(id);

    if (!vacante) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ERR_NOT_FOUND',
          message: 'Vacante no encontrada',
          details: [],
        },
      });
    }

    const camposPermitidos = [
      'titulo',
      'empresa',
      'ubicacion',
      'modalidad',
      'descripcion',
      'salario',
      'estado',
    ];

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        vacante[campo] = req.body[campo];
      }
    });

    await vacante.save();

    return res.json({
      success: true,
      data: vacante,
    });
  } catch (error) {
    next(error);
  }
}