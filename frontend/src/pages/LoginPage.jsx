import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/idksadasd.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login, register, oauthLogin, sendLoginCode } = useAuth();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // views: 'login' | 'register' | 'forgot-email'
  const [view, setView] = useState('login');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleOAuth = async (provider) => {
    try {
      setLoading(true);
      clearMessages();
      await oauthLogin(provider);
      // Navigation is handled by useEffect
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Inicio de sesión cancelado.');
      } else {
        setError('Error al iniciar sesión con ' + provider);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err) => {
    if (err.code === 'auth/email-already-in-use') {
      setError('Este correo electrónico ya está registrado. Por favor, intenta iniciar sesión.');
    } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      setError('Credenciales incorrectas. Verifica tus datos.');
    } else if (err.code === 'auth/weak-password') {
      setError('La contraseña es demasiado débil (mínimo 6 caracteres).');
    } else if (err.message) {
      setError(err.message);
    } else {
      setError('Ocurrió un error. Verifica tus datos e intenta nuevamente.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (view === 'login') {
        await login(email, password);
        // Navigation is handled by useEffect
      } else if (view === 'register') {
        if (!nombre.trim()) throw new Error("El nombre es requerido para registrarse.");
        if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
        await register(nombre, email, password);
        // Navigation is handled by useEffect
      } else if (view === 'forgot-email') {
        if (!email.trim()) throw new Error("El correo es requerido.");
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

  const renderTitle = () => {
    switch (view) {
      case 'login': return 'Bienvenido de nuevo';
      case 'register': return 'Crea tu cuenta profesional';
      case 'forgot-email': return 'Recuperar contraseña';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <div className="w-full max-w-[460px] bg-white/95 backdrop-blur-[10px] rounded-[20px] p-[40px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/40">
        <div className="auth-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={logo} alt="Sofi Logo" style={{ height: '100px', objectFit: 'contain', marginBottom: '10px' }} />
          <p className="auth-subtitle text-[15px] text-[#718096] m-0">{renderTitle()}</p>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {view === 'register' && (
            <div className="auth-form-group mb-4">
              <label className="auth-label block text-[13px] font-bold text-[#4a5568] mb-1.5 uppercase tracking-wide">Nombre completo</label>
              <input
                className="auth-input w-full p-3 border-2 border-[#e2e8f0] rounded-xl text-[15px] text-[#2d3748] bg-[#f8fafc] focus:outline-none focus:border-[#6b3fa0] focus:bg-white focus:ring-[3px] focus:ring-[#6b3fa0]/15 transition-all" type="text" value={nombre}
                onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Juan Pérez"
              />
            </div>
          )}

          {(view === 'login' || view === 'register' || view === 'forgot-email') && (
            <div className="auth-form-group mb-4">
              <label className="auth-label block text-[13px] font-bold text-[#4a5568] mb-1.5 uppercase tracking-wide">Correo electrónico</label>
              <input
                className="auth-input w-full p-3 border-2 border-[#e2e8f0] rounded-xl text-[15px] text-[#2d3748] bg-[#f8fafc] focus:outline-none focus:border-[#6b3fa0] focus:bg-white focus:ring-[3px] focus:ring-[#6b3fa0]/15 transition-all" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="correo@empresa.com"
              />
            </div>
          )}

          {(view === 'login' || view === 'register') && (
            <div className="auth-form-group mb-4">
              <label className="auth-label block text-[13px] font-bold text-[#4a5568] mb-1.5 uppercase tracking-wide">Contraseña</label>
              <input
                className="auth-input w-full p-3 border-2 border-[#e2e8f0] rounded-xl text-[15px] text-[#2d3748] bg-[#f8fafc] focus:outline-none focus:border-[#6b3fa0] focus:bg-white focus:ring-[3px] focus:ring-[#6b3fa0]/15 transition-all" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-btn w-full p-3.5 bg-gradient-to-br from-[#6b3fa0] to-[#5b8af0] text-white rounded-xl text-base font-bold cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(107,63,160,0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all mt-2.5">
            {loading ? 'Procesando...' :
              view === 'login' ? 'Ingresar' :
                view === 'register' ? 'Registrarse' :
                  'Enviar Enlace de Recuperación'}
          </button>
        </form>

        {(view === 'login' || view === 'register') && (
          <>
            <div className="auth-divider flex items-center text-center my-6 text-[#a0aec0] text-[13px] font-semibold before:content-[''] before:flex-1 before:border-b before:border-[#e2e8f0] before:mr-2 after:content-[''] after:flex-1 after:border-b after:border-[#e2e8f0] after:ml-2">o continúa con</div>

            <div className="auth-social-btns flex flex-col gap-3">
              <button type="button" className="auth-social-btn w-full p-3 bg-white border-[1.5px] border-[#d8ccf0] rounded-xl text-[14px] font-semibold text-[#52308a] cursor-pointer flex items-center justify-center gap-2.5 hover:bg-[#f5f0fc] hover:border-[#6b3fa0] transition-all" onClick={() => handleOAuth('google')} disabled={loading}>
                <svg className="auth-social-icon w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>

              <button type="button" className="auth-social-btn w-full p-3 bg-white border-[1.5px] border-[#d8ccf0] rounded-xl text-[14px] font-semibold text-[#52308a] cursor-pointer flex items-center justify-center gap-2.5 hover:bg-[#f5f0fc] hover:border-[#6b3fa0] transition-all" onClick={() => handleOAuth('github')} disabled={loading}>
                <svg className="auth-social-icon w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                GitHub
              </button>
            </div>
          </>
        )}

        <div className="auth-toggle text-center mt-6 text-[14px] text-[#4a5568]">
          {(view === 'login' || view === 'register') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <div>
                {view === 'login' ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}{' '}
                <button type="button" onClick={() => { setView(view === 'login' ? 'register' : 'login'); clearMessages(); }} className="auth-toggle-link text-[#6b3fa0] font-bold cursor-pointer bg-transparent border-none p-0 text-[14px] hover:underline">
                  {view === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
                </button>
              </div>

              {view === 'login' && (
                <button type="button" onClick={() => { setView('forgot-email'); clearMessages(); }} className="auth-toggle-link text-[#6b3fa0] font-bold cursor-pointer bg-transparent border-none p-0 text-[14px] hover:underline mt-1.5">
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => { setView('login'); clearMessages(); }} className="auth-toggle-link text-[#6b3fa0] font-bold cursor-pointer bg-transparent border-none p-0 text-[14px] hover:underline">
              Volver al inicio de sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
