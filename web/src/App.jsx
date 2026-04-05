import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
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
        <button onClick={handleLogout}>Cerrar sesión</button>
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
      </Routes>
    </AuthProvider>
  );
}