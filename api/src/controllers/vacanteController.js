import Vacante from '../models/Vacante.js';

export const getVacantes = async (req, res, next) => {
  try {
    const vacantes = await Vacante.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: vacantes
    });
  } catch (error) {
    next(error);
  }
};

export const createVacante = async (req, res, next) => {
  try {
    const usuarioId = req.user?.sub || req.user?._id || req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const nuevaVacante = new Vacante({
      ...req.body,
      creadaPor: usuarioId
    });

    const vacanteGuardada = await nuevaVacante.save();

    return res.status(201).json({
      success: true,
      data: vacanteGuardada
    });
  } catch (error) {
    next(error);
  }
};

export const updateVacante = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vacanteActualizada = await Vacante.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!vacanteActualizada) {
      return res.status(404).json({
        success: false,
        message: 'Vacante no encontrada'
      });
    }

    return res.status(200).json({
      success: true,
      data: vacanteActualizada
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVacante = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vacante = await Vacante.findByIdAndDelete(id);

    if (!vacante) {
      return res.status(404).json({
        success: false,
        message: 'Vacante no encontrada'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vacante eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
};