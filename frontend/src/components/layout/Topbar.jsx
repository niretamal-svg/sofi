import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import toast from 'react-hot-toast';

function MiniSofiLogo() {
  return (
    <svg viewBox="0 0 620 170" className="topbar-brand-mark" role="img" aria-label="SOFI">
      <defs>
        <linearGradient id="topbarSofiHex" x1="36" y1="20" x2="128" y2="148" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9b5de5" />
          <stop offset="1" stopColor="#4d2398" />
        </linearGradient>
        <linearGradient id="topbarSofiText" x1="190" y1="32" x2="600" y2="142" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9ddff" />
        </linearGradient>
      </defs>
      <path d="M82 16 144 52v72L82 160 20 124V52L82 16Z" fill="url(#topbarSofiHex)" />
      <path d="M38 66c0-9 10-15 18-10l43 25c7 4 11 12 11 20v35L49 101c-7-4-11-12-11-20V66Z" fill="#4b238e" opacity="0.92" />
      <path d="M56 91c4 31 49 31 53 0" stroke="#fff" strokeWidth="14" strokeLinecap="round" fill="none" />
      <text x="188" y="116" fill="url(#topbarSofiText)" fontSize="86" fontWeight="900" letterSpacing="18">SOFI</text>
    </svg>
  );
}

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
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
          <MiniSofiLogo />
        </button>
      ) : (
        <div className="topbar-logo" aria-hidden="true" />
      )}

      {user && (
        <nav className="topbar-nav" aria-label="Menu principal">
          {[
            { path: '/dashboard', label: t('dashboardNav') },
            { path: '/publication', label: t('publicationNav') },
            { path: '/guide', label: t('guideNav') },
          ].map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`topbar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
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
          </div>
        )}

        {user && (
          <button type="button" className="btn-salir" onClick={handleLogout}>
            {t('logout')}
          </button>
        )}
      </div>
    </div>
  );
}
