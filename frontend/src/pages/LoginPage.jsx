import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login, register, oauthLogin, sendLoginCode } = useAuth();
  const { t } = useAppSettings();

  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const userRole = 'reclutador';

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAdminCard, setShowAdminCard] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/publication', { replace: true });
    }
  }, [user, navigate]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleError = (err) => {
    if (err?.code === 'auth/email-already-in-use') {
      setError('Este correo ya está registrado. Usa otro o inicia sesión.');
    } else if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
    } else if (err?.code === 'auth/weak-password') {
      setError('La contraseña es demasiado débil. Usa al menos 6 caracteres.');
    } else if (err?.message) {
      setError(err.message);
    } else {
      setError('Ocurrió un error. Intenta de nuevo.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (view === 'login') {
        await login(email, password);
      } else if (view === 'register') {
        if (!nombre.trim()) throw new Error('El nombre es obligatorio.');
        if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
        await register(nombre, email, password);
        setSuccess('Registro exitoso. Inicia sesión para continuar.');
        setView('login');
        setNombre('');
        setPassword('');
      } else if (view === 'forgot') {
        if (!email.trim()) throw new Error('El correo es obligatorio.');
        const res = await sendLoginCode(email);
        setSuccess(res.message);
        setTimeout(() => setView('login'), 3000);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
      setLoading(true);
      clearMessages();
      await oauthLogin(provider);
    } catch (err) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Inicio de sesión cancelado.');
      } else {
        handleError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const formTitle = view === 'login'
    ? t('loginTitle')
    : view === 'register'
      ? t('registerTitle')
      : t('forgotTitle');

  const formSubtitle = view === 'login'
    ? t('loginSubtitle')
    : view === 'register'
      ? t('registerSubtitle')
      : t('forgotSubtitle');

  return (
    <div className="min-h-screen relative overflow-hidden bg-bg-main dark:bg-[#0b1224]">
      <Topbar />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <div className="absolute -left-32 -top-32 w-72 h-72 rounded-full bg-[#6b3fa0]/15 blur-3xl" />
        <div className="absolute -right-24 bottom-0 w-72 h-72 rounded-full bg-[#00c9a7]/15 blur-3xl" />

        <div className="relative z-10 w-full max-w-xl">
          <div className="surface p-8 md:p-10 shadow-[0_32px_80px_rgba(30,41,59,0.12)]">
            <div className="text-center mb-8">
              <div className={`mx-auto mb-5 flex h-20 w-28 items-center justify-center rounded-3xl ${userRole === 'reclutador' ? 'bg-[#6b3fa0]' : 'bg-slate-800'} text-white shadow-xl`}>
                <span className="text-2xl font-black tracking-[0.35em]">SOFI</span>
              </div>
              <h1 className="text-3xl font-black text-text-main dark:text-white mb-2">{formTitle}</h1>
              <p className="text-sm text-text-muted dark:text-slate-400">{formSubtitle}</p>
            </div>

            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center rounded-2xl bg-sofi-purple px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-[#6b3fa0]/20">
                {t('roleRecruiter')}
              </div>
            </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {view === 'register' && (
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.35em] text-text-muted dark:text-slate-400">{t('nameLabel')}</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className="input-field"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.35em] text-text-muted dark:text-slate-400">{t('emailLabel')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="input-field"
              />
            </div>

            {(view === 'login' || view === 'register') && (
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.35em] text-text-muted dark:text-slate-400">{t('passwordLabel')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  className="input-field"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#6b3fa0] to-[#5b8af0] text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#6b3fa0]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? t('loading') : view === 'login' ? t('loginButton') : view === 'register' ? t('registerButton') : t('sendLinkButton')}
            </button>
          </form>

          {(view === 'login' || view === 'register') && (
            <div className="mt-8">
              <div className="relative text-center text-[10px] uppercase tracking-[0.25em] text-text-muted dark:text-slate-400">
                <div className="absolute inset-x-0 top-1/2 h-px bg-border-main" />
                <span className="relative bg-card px-4 dark:bg-[#111827]">{t('continueWith')}</span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                  className="flex h-14 items-center justify-center gap-3 rounded-full border border-border-main bg-card text-sm font-black uppercase tracking-[0.14em] text-text-main transition hover:border-sofi-purple hover:bg-sofi-purple/5 disabled:cursor-not-allowed dark:bg-[#1f2937] dark:text-slate-200"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f8fafc] text-lg font-black dark:bg-[#111827]">
                    G
                  </span>
                  {t('googleButton')}
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth('microsoft')}
                  disabled={loading}
                  className="flex h-14 items-center justify-center gap-3 rounded-full border border-border-main bg-card text-sm font-black uppercase tracking-[0.14em] text-text-main transition hover:border-sofi-purple hover:bg-sofi-purple/5 disabled:cursor-not-allowed dark:bg-[#1f2937] dark:text-slate-200"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f8fafc] text-lg font-black dark:bg-[#111827]">
                    M
                  </span>
                  {t('microsoftButton')}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-sm text-slate-500">
            {(view === 'login' || view === 'register') ? (
              <>
                <p className="mb-3">
                  {view === 'login' ? t('noAccount') : t('alreadyAccount')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setView(view === 'login' ? 'register' : 'login');
                    clearMessages();
                  }}
                  className="font-black uppercase tracking-[0.2em] text-[#6b3fa0] hover:underline"
                >
                  {view === 'login' ? t('signUpHere') : t('logIn')}
                </button>
                {view === 'login' && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot');
                        clearMessages();
                      }}
                      className="font-black uppercase tracking-[0.2em] text-[#6b3fa0] hover:underline"
                    >
                      {t('forgotPassword')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  clearMessages();
                }}
                className="font-black uppercase tracking-[0.2em] text-[#6b3fa0] hover:underline"
              >
                {t('logIn')}
              </button>
            )}
          </div>

          <div className="mt-8 border-t border-border-main pt-6 text-center">
            <button
              type="button"
              onClick={() => setShowAdminCard(true)}
              className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted transition hover:text-text-main dark:text-slate-400 dark:hover:text-white"
            >
              Acceso administrativo
            </button>
          </div>
        </div>
      </div>

      {showAdminCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-[2rem] border border-border-main bg-card p-8 shadow-[0_32px_80px_rgba(30,41,59,0.18)] dark:bg-[#111827]">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-slate-400">Acceso restringido</p>
                <h2 className="mt-3 text-2xl font-black text-text-main dark:text-white">Admin</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminCard(false)}
                className="text-text-muted hover:text-text-main dark:text-slate-400 dark:hover:text-white transition"
              >
                ×
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                clearMessages();
                setLoading(true);
                try {
                  await login(email, password);
                } catch (err) {
                  handleError(err);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.35em] text-text-muted dark:text-slate-400">Correo</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sofi.com"
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.35em] text-text-muted dark:text-slate-400">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-sofi-purple text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-purple-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Cargando...' : 'Ingresar admin'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
