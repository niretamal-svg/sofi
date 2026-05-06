import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Topbar() {
  const navigate = useNavigate();

  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <div className="topbar">
      <button 
        onClick={() => navigate('/dashboard')}
        className="topbar-logo"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        SOFI · Sistema de Reclutamiento
      </button>
      <div className="topbar-user">
        <span>USUARIO – RECLUTAMIENTO ARMSTRONG</span>
        <button className="btn-salir" onClick={handleLogout}>SALIR</button>
      </div>
    </div>
  );
}
