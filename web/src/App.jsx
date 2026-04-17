import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import VacantesPage from './pages/VacantesPage.jsx';
import PublicacionPortalesPage from './pages/PublicacionPortalesPage.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-shell">
      <div className="card">
        <h1>SOFI · Primera entrega</h1>
        <p>Login funcionando correctamente.</p>

        <div className="user-box">
          <strong>Usuario:</strong> {user?.nombre}<br />
          <strong>Email:</strong> {user?.email}<br />
          <strong>Rol:</strong> {user?.rol}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/vacantes')}>
            Ir a vacantes
          </button>

          {/* 👇 NUEVO BOTÓN */}
          <button onClick={() => navigate('/publicacion-portales')}>
            Ir a publicación
          </button>

          <button onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/vacantes"
          element={
            <PrivateRoute>
              <VacantesPage />
            </PrivateRoute>
          }
        />

        {/* 👇 NUEVA RUTA */}
        <Route
          path="/publicacion-portales"
          element={
            <PrivateRoute>
              <PublicacionPortalesPage />
            </PrivateRoute>
          }
        />

      </Routes>
    </AuthProvider>
  );
}