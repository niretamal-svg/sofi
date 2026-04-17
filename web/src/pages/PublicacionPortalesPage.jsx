import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function PublicacionPortalesPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [vacantes, setVacantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVacante, setSelectedVacante] = useState(null);

  const fetchVacantes = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/vacantes');
      const lista = data.data || [];
      setVacantes(lista);

      if (lista.length > 0) {
        setSelectedVacante(lista[0]);
      }
    } catch (err) {
      setError('No se pudieron cargar las vacantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacantes();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleContinuar = () => {
    if (!selectedVacante) return;

    navigate(`/publicacion-portales/${selectedVacante._id}/perfil`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb' }}>
      <div
        style={{
          background: '#6B3FA0',
          color: '#fff',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <strong>SOFI · Sistema de Reclutamiento</strong>

        <button
          onClick={handleLogout}
          style={{
            background: '#00C9A7',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          Salir
        </button>
      </div>

      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '12px 24px',
          fontSize: '13px',
          color: '#666'
        }}
      >
        Menú administrador &nbsp;›&nbsp; Gestión de vacantes &nbsp;›&nbsp; <strong style={{ color: '#222' }}>Publicación en portales</strong>
      </div>

      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '28px 20px 40px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '34px' }}>Publicación en portales de empleo</h1>
        <p style={{ margin: '0 0 24px', color: '#6b7280' }}>
          Selecciona una vacante existente para continuar con el flujo de publicación.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            border: '1px solid #e5e7eb',
            borderRadius: '14px',
            overflow: 'hidden',
            background: '#fff',
            marginBottom: '24px'
          }}
        >
          <StepItem number="1" title="Seleccionar vacante" active />
          <StepItem number="2" title="Perfil y descripción" />
          <StepItem number="3" title="Seleccionar portales" />
          <StepItem number="4" title="Confirmar y publicar" />
        </div>

        {error && (
          <div
            style={{
              marginBottom: '18px',
              padding: '12px 16px',
              background: '#ffe7e7',
              border: '1px solid #ffb9b9',
              borderRadius: '10px',
              color: '#9b1c1c'
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.1fr 0.9fr',
            gap: '20px',
            alignItems: 'start'
          }}
        >
          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '16px',
                fontWeight: 700
              }}
            >
              Selecciona la vacante a publicar
            </div>

            <div style={{ padding: '18px 20px' }}>
              {loading ? (
                <p>Cargando vacantes...</p>
              ) : vacantes.length === 0 ? (
                <p>No hay vacantes registradas todavía.</p>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {vacantes.map((vacante) => {
                    const isSelected = selectedVacante?._id === vacante._id;

                    return (
                      <div
                        key={vacante._id}
                        onClick={() => setSelectedVacante(vacante)}
                        style={{
                          border: isSelected ? '2px solid #6B3FA0' : '1px solid #e5e7eb',
                          background: isSelected ? '#f5f0fc' : '#fff',
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '12px',
                            alignItems: 'flex-start'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '12px', color: '#6B3FA0', fontWeight: 700, marginBottom: '6px' }}>
                              #{vacante._id.slice(-4).toUpperCase()}
                            </div>

                            <h3 style={{ margin: '0 0 6px', fontSize: '20px' }}>{vacante.titulo}</h3>

                            <p style={{ margin: '0 0 4px', color: '#555' }}>
                              <strong>{vacante.empresa}</strong> · {vacante.modalidad}
                            </p>

                            <p style={{ margin: '0 0 4px', color: '#555' }}>
                              {vacante.ubicacion}
                            </p>

                            <p style={{ margin: 0, color: '#555' }}>
                              ${Number(vacante.salario).toLocaleString('es-CL')}
                            </p>
                          </div>

                          <span
                            style={{
                              padding: '6px 10px',
                              borderRadius: '999px',
                              background:
                                vacante.estado === 'Activa'
                                  ? '#dcfce7'
                                  : vacante.estado === 'Pausada'
                                  ? '#fef3c7'
                                  : '#fee2e2',
                              color:
                                vacante.estado === 'Activa'
                                  ? '#166534'
                                  : vacante.estado === 'Pausada'
                                  ? '#92400e'
                                  : '#991b1b',
                              fontWeight: 700,
                              fontSize: '12px'
                            }}
                          >
                            {vacante.estado}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'sticky',
              top: '20px'
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '16px',
                fontWeight: 700
              }}
            >
              Vacante seleccionada
            </div>

            <div style={{ padding: '20px' }}>
              {!selectedVacante ? (
                <p style={{ color: '#666' }}>Selecciona una vacante para ver el detalle.</p>
              ) : (
                <>
                  <div style={{ fontSize: '34px', fontWeight: 800, color: '#6B3FA0', marginBottom: '6px' }}>
                    #{selectedVacante._id.slice(-4).toUpperCase()}
                  </div>

                  <h2 style={{ margin: '0 0 8px', fontSize: '28px', lineHeight: 1.2 }}>
                    {selectedVacante.titulo}
                  </h2>

                  <p style={{ margin: '0 0 18px', color: '#6b7280' }}>
                    {selectedVacante.empresa} · {selectedVacante.modalidad} · {selectedVacante.estado}
                  </p>

                  <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 18px' }} />

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
                      Empresa
                    </div>
                    <div style={{ fontWeight: 600 }}>{selectedVacante.empresa}</div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
                      Ubicación
                    </div>
                    <div>{selectedVacante.ubicacion}</div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
                      Salario
                    </div>
                    <div>${Number(selectedVacante.salario).toLocaleString('es-CL')}</div>
                  </div>

                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
                      Descripción
                    </div>
                    <div style={{ color: '#555', lineHeight: 1.6 }}>
                      {selectedVacante.descripcion}
                    </div>
                  </div>

                  <button
                    onClick={handleContinuar}
                    style={{
                      width: '100%',
                      background: '#6B3FA0',
                      color: '#fff',
                      border: 'none',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Continuar →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepItem({ number, title, active = false }) {
  return (
    <div
      style={{
        padding: '16px 18px',
        background: active ? '#f5f0fc' : '#fff',
        borderRight: '1px solid #e5e7eb'
      }}
    >
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: active ? '#6B3FA0' : '#e5e7eb',
          color: active ? '#fff' : '#666',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          marginBottom: '8px'
        }}
      >
        {number}
      </div>

      <div style={{ fontSize: '12px', color: '#6b7280' }}>Paso {number}</div>
      <div style={{ fontWeight: 700 }}>{title}</div>
    </div>
  );
}