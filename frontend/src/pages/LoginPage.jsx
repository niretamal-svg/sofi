import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';

const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== 'false';

function SofiBrandLogo() {
  return (
    <svg viewBox="0 0 620 170" className="h-auto w-full max-w-[330px]" role="img" aria-label="SOFI">
      <defs>
        <linearGradient id="sofiHex" x1="36" y1="20" x2="128" y2="148" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9b5de5" />
          <stop offset="1" stopColor="#4d2398" />
        </linearGradient>
        <linearGradient id="sofiHexShade" x1="42" y1="55" x2="105" y2="126" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4b238e" />
          <stop offset="1" stopColor="#6b35bd" />
        </linearGradient>
        <linearGradient id="sofiText" x1="190" y1="32" x2="600" y2="142" gradientUnits="userSpaceOnUse">
          <stop stopColor="#35137e" />
          <stop offset="0.7" stopColor="#4c2494" />
          <stop offset="1" stopColor="#7d3bd5" />
        </linearGradient>
      </defs>
      <path
        d="M82 16 144 52v72L82 160 20 124V52L82 16Z"
        fill="url(#sofiHex)"
        filter="drop-shadow(0 14px 18px rgba(64, 24, 133, 0.18))"
      />
      <path
        d="M38 66c0-9 10-15 18-10l43 25c7 4 11 12 11 20v35L49 101c-7-4-11-12-11-20V66Z"
        fill="url(#sofiHexShade)"
        opacity="0.92"
      />
      <path
        d="M56 91c4 31 49 31 53 0"
        fill="none"
        stroke="#ffffff"
        strokeWidth="18"
        strokeLinecap="round"
      />
      <path
        d="M104 63c14-14 37-14 51 0"
        fill="none"
        stroke="#2b116d"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <text
        x="186"
        y="130"
        fill="url(#sofiText)"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="118"
        fontWeight="700"
        letterSpacing="2"
      >
        SOFI
      </text>
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login, register, oauthLogin, sendLoginCode } = useAuth();
  const { locale, toggleLocale, t } = useAppSettings();

  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#22074e] text-[#15133f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(120,58,215,0.55),transparent_32%),radial-gradient(circle_at_82%_72%,rgba(185,118,255,0.6),transparent_34%),linear-gradient(135deg,#1b063f_0%,#3b0b79_48%,#6a31d8_100%)]" />
      <div className="absolute inset-0 opacity-90">
        <div className="login-light-arc login-light-arc-one" />
        <div className="login-light-arc login-light-arc-two" />
        <div className="login-light-arc login-light-arc-three" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.04),transparent_28%,rgba(255,255,255,0.09)_58%,transparent_72%)]" />
      <button
        type="button"
        onClick={toggleLocale}
        title={t('languageSwitch')}
        className="absolute right-5 top-5 z-20 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-black text-white shadow-lg backdrop-blur transition hover:bg-white/25"
      >
        {locale.toUpperCase()}
      </button>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:px-6">
        <div className="w-full max-w-[560px] rounded-[2.1rem] border-2 border-[#d893ff] bg-white/95 px-6 py-7 shadow-[0_0_22px_rgba(223,137,255,0.8),0_28px_72px_rgba(29,4,78,0.3)] backdrop-blur md:px-10 md:py-8">
          <div className="text-center">
            <div className="mx-auto flex justify-center">
              <SofiBrandLogo />
            </div>
          </div>

          <div className="mb-7 mt-4 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-[#f6f1ff] px-5 py-2.5 text-[0.68rem] font-black uppercase tracking-[0.24em] text-[#6020bd] shadow-[0_10px_20px_rgba(83,44,152,0.11)]">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
                <path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {t('roleRecruiter')}
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {success}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {view === 'register' && (
              <div>
                <label className="mb-2.5 block text-[0.7rem] font-black uppercase tracking-[0.32em] text-[#5d617d]">{t('nameLabel')}</label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6f7494]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    className="h-14 w-full rounded-2xl border border-[#ccd1df] bg-white px-14 text-base font-semibold text-[#17162e] outline-none shadow-[0_8px_18px_rgba(21,19,63,0.06)] transition focus:border-[#7c35d8] focus:shadow-[0_0_0_3px_rgba(124,53,216,0.12)]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-2.5 block text-[0.7rem] font-black uppercase tracking-[0.32em] text-[#5d617d]">{t('emailLabel')}</label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6f7494]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 6.75h16v10.5H4V6.75Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="m5 8 7 5 7-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mocksEnabled && view === 'login' ? 'admin@sofi.com' : t('emailPlaceholder')}
                  className="h-14 w-full rounded-2xl border border-[#ccd1df] bg-white px-14 text-base font-semibold text-[#17162e] outline-none shadow-[0_8px_18px_rgba(21,19,63,0.06)] transition placeholder:text-[#17162e] focus:border-[#7c35d8] focus:shadow-[0_0_0_3px_rgba(124,53,216,0.12)]"
                />
              </div>
            </div>

            {(view === 'login' || view === 'register') && (
              <div>
                <label className="mb-2.5 block text-[0.7rem] font-black uppercase tracking-[0.32em] text-[#5d617d]">{t('passwordLabel')}</label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6f7494]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7 10V8a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M5.75 10h12.5v9.25H5.75V10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M12 14v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    className="h-14 w-full rounded-2xl border border-[#ccd1df] bg-white px-14 pr-16 text-base font-semibold text-[#17162e] outline-none shadow-[0_8px_18px_rgba(21,19,63,0.06)] transition focus:border-[#7c35d8] focus:shadow-[0_0_0_3px_rgba(124,53,216,0.12)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#6f7494] transition hover:bg-[#f2ecff] hover:text-[#5d21bd]"
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M2.75 12s3.25-5.5 9.25-5.5 9.25 5.5 9.25 5.5-3.25 5.5-9.25 5.5S2.75 12 2.75 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                      <path d="M12 14.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#6417c8] to-[#5278ff] text-base font-black text-white shadow-[0_14px_24px_rgba(96,39,203,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(96,39,203,0.31)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? t('loading') : view === 'login' ? t('loginButton') : view === 'register' ? t('registerButton') : t('sendLinkButton')}
            </button>
          </form>

          {(view === 'login' || view === 'register') && (
            <div className="mt-7">
              <div className="relative text-center text-[0.68rem] font-black uppercase tracking-[0.26em] text-[#666b85]">
                <div className="absolute inset-x-0 top-1/2 h-px bg-[#d8dbe5]" />
                <span className="relative bg-white px-5">{t('continueWith')}</span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                  className="flex h-14 items-center justify-center gap-4 rounded-2xl border border-[#d8dce8] bg-white text-base font-black text-[#191840] shadow-[0_8px_18px_rgba(21,19,63,0.05)] transition hover:border-[#af8cff] hover:bg-[#fbf8ff] disabled:cursor-not-allowed"
                >
                  <span className="text-2xl font-black text-[#4285f4]">G</span>
                  {t('googleButton')}
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth('microsoft')}
                  disabled={loading}
                  className="flex h-14 items-center justify-center gap-4 rounded-2xl border border-[#d8dce8] bg-white text-base font-black text-[#191840] shadow-[0_8px_18px_rgba(21,19,63,0.05)] transition hover:border-[#af8cff] hover:bg-[#fbf8ff] disabled:cursor-not-allowed"
                >
                  <span className="grid h-6 w-6 grid-cols-2 gap-0.5" aria-hidden="true">
                    <span className="bg-[#f25022]" />
                    <span className="bg-[#7fba00]" />
                    <span className="bg-[#00a4ef]" />
                    <span className="bg-[#ffb900]" />
                  </span>
                  {t('microsoftButton')}
                </button>
              </div>
            </div>
          )}

          <div className="mt-7 text-center text-base font-medium text-[#5f647f]">
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
                  className="block w-full font-black text-[#5f18bd] transition hover:text-[#401084]"
                >
                  {view === 'login' ? t('signUpHere') : t('logIn')}
                </button>
                {view === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      clearMessages();
                    }}
                    className="mt-3 block w-full font-black text-[#5f18bd] transition hover:text-[#401084]"
                  >
                    {t('forgotPassword')}
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  clearMessages();
                }}
                className="font-black text-[#5f18bd] transition hover:text-[#401084]"
              >
                {t('logIn')}
              </button>
            )}
          </div>

          <div className="mt-7 border-t border-[#d8dbe5] pt-5 text-center">
            <button
              type="button"
              onClick={() => setShowAdminCard(true)}
              className="inline-flex items-center justify-center gap-3 text-base font-medium text-[#6420c8] transition hover:text-[#401084]"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3.25 19 6v5.25c0 4.25-2.8 7.85-7 9.5-4.2-1.65-7-5.25-7-9.5V6l7-2.75Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-slate-400">{t('restrictedAccess')}</p>
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
                  placeholder={mocksEnabled ? 'admin@sofi.com' : t('emailPlaceholder')}
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
                {loading ? t('loading') : t('adminSignIn')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
