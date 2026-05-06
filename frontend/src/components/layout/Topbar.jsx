import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import toast from 'react-hot-toast';

export default function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, locale, toggleTheme, toggleLocale, t } = useAppSettings();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error(t('logout') + ' failed');
    }
  };

  return (
    <div className="topbar">
      {user ? (
        <button type="button" onClick={() => navigate('/publication')} className="topbar-logo">
          {t('appName')}
        </button>
      ) : (
        <div className="topbar-logo" aria-hidden="true" />
      )}

      <div className="topbar-actions">
        <button
          type="button"
          className="btn-icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? t('switchToLight') : t('switchToDark')}
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>

        <button
          type="button"
          className="btn-icon"
          onClick={toggleLocale}
          title={t('languageLabel')}
        >
          {locale.toUpperCase()}
        </button>

        {user && (
          <div className="topbar-user">
            <span>{user.email || t('activeUser')}</span>
            <button type="button" className="btn-salir" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
