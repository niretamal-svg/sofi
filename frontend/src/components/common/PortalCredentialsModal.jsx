import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { portalsApi } from '../../services/api';

export default function PortalCredentialsModal({ portal, onClose, onSave }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await portalsApi.saveCredentials(portal.id, {
        username: data.username,
        password: data.password,
      });
      toast.success('Credenciales guardadas correctamente');
      onSave?.();
      onClose();
    } catch (error) {
      toast.error('Error al guardar las credenciales');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {portal?.logo_url && (
              <img
                src={portal.logo_url}
                alt={portal.nombre}
                className="w-8 h-8 object-contain"
              />
            )}
            <h3 className="text-lg font-semibold text-gray-900">{portal?.nombre}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Por favor ingresa tus credenciales para publicar en este portal.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario o correo
            </label>
            <input
              type="text"
              {...register('username', { required: 'Este campo es requerido' })}
              className="input-primary"
              placeholder="tu_usuario"
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              {...register('password', { required: 'Este campo es requerido' })}
              className="input-primary"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
            🔒 Tus credenciales se almacenan de forma cifrada y segura.
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar credenciales'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
