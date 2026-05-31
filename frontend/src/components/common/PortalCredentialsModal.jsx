import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { portalsApi } from '../../services/api';

export default function PortalCredentialsModal({ portal, onClose, onSave }) {
  const { t } = useAppSettings();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await portalsApi.saveCredentials(portal.id, {
        username: data.username,
        password: data.password,
      });
      toast.success(t('credentialsSaved'));
      onSave?.();
      onClose();
    } catch (error) {
      toast.error(t('credentialsSaveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-md w-full p-6 dark:bg-[#111827]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {portal?.logo_url && (
              <img src={portal.logo_url} alt={portal.nombre} className="w-8 h-8 object-contain" />
            )}
            <h3 className="text-lg font-semibold text-text-main dark:text-white">{portal?.nombre}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            x
          </button>
        </div>

        <p className="text-sm text-text-muted dark:text-slate-400 mb-4">
          {t('portalCredentialsHelp')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted dark:text-slate-400 mb-2">
              {t('usernameOrEmail')}
            </label>
            <input
              type="text"
              {...register('username', { required: t('requiredField') })}
              className="input-field"
              placeholder="tu_usuario"
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted dark:text-slate-400 mb-2">
              {t('passwordLabel')}
            </label>
            <input
              type="password"
              {...register('password', { required: t('requiredField') })}
              className="input-field"
              placeholder={t('passwordPlaceholder')}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
            {t('secureCredentials')}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              {t('cancel')}
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary disabled:opacity-50">
              {loading ? t('saving') : t('saveCredentials')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
