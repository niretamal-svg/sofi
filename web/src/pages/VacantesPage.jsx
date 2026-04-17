import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function VacantesPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [vacantes, setVacantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    titulo: '',
    empresa: '',
    ubicacion: '',
    modalidad: 'Hibrido',
    descripcion: '',
    salario: '',
    estado: 'Activa'
  });

  const fetchVacantes = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/vacantes');
      setVacantes(data.data || []);
    } catch (err) {
      setError('No se pudieron cargar las vacantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacantes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setForm({
      titulo: '',
      empresa: '',
      ubicacion: '',
      modalidad: 'Hibrido',
      descripcion: '',
      salario: '',
      estado: 'Activa'
    });
    setEditingId(null);
  };

  const handleEdit = (vacante) => {
    setForm({
      titulo: vacante.titulo,
      empresa: vacante.empresa,
      ubicacion: vacante.ubicacion,
      modalidad: vacante.modalidad,
      descripcion: vacante.descripcion,
      salario: vacante.salario,
      estado: vacante.estado
    });

    setEditingId(vacante._id);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('¿Seguro que deseas eliminar esta vacante?');

    if (!confirmDelete) return;

    try {
      setError('');
      await api.delete(`/vacantes/${id}`);
      await fetchVacantes();

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      setError('No se pudo eliminar la vacante');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/vacantes/${editingId}`, {
          ...form,
          salario: Number(form.salario)
        });
      } else {
        await api.post('/vacantes', {
          ...form,
          salario: Number(form.salario)
        });
      }

      resetForm();
      await fetchVacantes();
    } catch (err) {
      setError('No se pudo guardar la vacante');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb', padding: '24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>Vacantes</h1>
            <p style={{ margin: '8px 0 0', color: '#666' }}>
              Crea y visualiza vacantes del sistema.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #ccc',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              Volver al dashboard
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: 'none',
                background: '#6B3FA0',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: '16px',
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
            gridTemplateColumns: '1fr 1.2fr',
            gap: '24px'
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {editingId ? 'Editar vacante' : 'Crear vacante'}
            </h2>

            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Título
              </label>
              <input
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
                required
                style={inputStyle}
              />

              <label style={labelStyle}>Empresa</label>
              <input
                name="empresa"
                value={form.empresa}
                onChange={handleChange}
                required
                style={inputStyle}
              />

              <label style={labelStyle}>Ubicación</label>
              <input
                name="ubicacion"
                value={form.ubicacion}
                onChange={handleChange}
                required
                style={inputStyle}
              />

              <label style={labelStyle}>Modalidad</label>
              <select
                name="modalidad"
                value={form.modalidad}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="Presencial">Presencial</option>
                <option value="Hibrido">Hibrido</option>
                <option value="Remoto">Remoto</option>
              </select>

              <label style={labelStyle}>Descripción</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                required
                rows="4"
                style={{ ...inputStyle, resize: 'vertical' }}
              />

              <label style={labelStyle}>Salario</label>
              <input
                name="salario"
                type="number"
                value={form.salario}
                onChange={handleChange}
                required
                style={inputStyle}
              />

              <label style={labelStyle}>Estado</label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="Activa">Activa</option>
                <option value="Pausada">Pausada</option>
                <option value="Cerrada">Cerrada</option>
              </select>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#6B3FA0',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  {saving ? 'Guardando...' : editingId ? 'Actualizar vacante' : 'Crear vacante'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: '1px solid #ccc',
                      background: '#fff',
                      color: '#333',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
            }}
          >
            <h2 style={{ marginTop: 0 }}>Listado de vacantes</h2>

            {loading ? (
              <p>Cargando vacantes...</p>
            ) : vacantes.length === 0 ? (
              <p>No hay vacantes registradas todavía.</p>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {vacantes.map((vacante) => (
                  <div
                    key={vacante._id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ width: '100%' }}>
                        <h3 style={{ margin: '0 0 8px' }}>{vacante.titulo}</h3>
                        <p style={{ margin: '0 0 6px', color: '#444' }}>
                          <strong>Empresa:</strong> {vacante.empresa}
                        </p>
                        <p style={{ margin: '0 0 6px', color: '#444' }}>
                          <strong>Ubicación:</strong> {vacante.ubicacion}
                        </p>
                        <p style={{ margin: '0 0 6px', color: '#444' }}>
                          <strong>Modalidad:</strong> {vacante.modalidad}
                        </p>
                        <p style={{ margin: '0 0 6px', color: '#444' }}>
                          <strong>Salario:</strong> ${Number(vacante.salario).toLocaleString('es-CL')}
                        </p>
                        <p style={{ margin: '0 0 10px', color: '#444' }}>
                          <strong>Estado:</strong> {vacante.estado}
                        </p>
                        <p style={{ margin: 0, color: '#666' }}>{vacante.descripcion}</p>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button
                            onClick={() => handleEdit(vacante)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#2563eb',
                              color: '#fff',
                              cursor: 'pointer'
                            }}
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => handleDelete(vacante._id)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#dc2626',
                              color: '#fff',
                              cursor: 'pointer'
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      <span
                        style={{
                          alignSelf: 'flex-start',
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #ccc',
  marginBottom: '16px',
  fontSize: '14px'
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: 600
};