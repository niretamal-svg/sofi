import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { usePublicationStore } from '../../store/publicationStore';
import { vacanciesApi, companiesApi, categoriesApi } from '../../services/api';

export default function Step1Vacancy() {
  const [activeTab, setActiveTab] = useState('existing');
  const [vacancies, setVacancies] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todas');
  
  const { selectedVacancy, setSelectedVacancy, setStep } = usePublicationStore();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      estado: 'Borrador'
    }
  });

  const watchNombre = watch('nombre');
  const watchEmpresaId = watch('empresa_id');
  const watchCategoriaId = watch('categoria_id');
  const watchEstado = watch('estado');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vacanciesToLoad, companiesToLoad, categoriesToLoad] = await Promise.all([
        vacanciesApi.getAll(),
        companiesApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setVacancies(vacanciesToLoad || []);
      setCompanies(companiesToLoad || []);
      setCategories(categoriesToLoad || []);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const onCreateVacancy = async (data, goToNext) => {
    try {
      const created = await vacanciesApi.create(data);
      setVacancies([...vacancies, created]);
      setSelectedVacancy(created);
      toast.success('Vacante creada correctamente');
      
      if (goToNext) {
        setStep(2);
      } else {
        setActiveTab('existing');
      }
    } catch (error) {
      toast.error('Error al crear la vacante');
    }
  };

  const filteredVacancies = vacancies.filter((v) => {
    const matchesSearch = v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || String(v.codigo).includes(searchTerm);
    if (statusFilter === 'Todas') return matchesSearch;
    if (statusFilter === 'Activas') return matchesSearch && v.estado?.toLowerCase() === 'vigente';
    if (statusFilter === 'Sin publicar') return matchesSearch && v.estado?.toLowerCase() !== 'vigente';
    return matchesSearch;
  });

  const getEmpresaName = (id) => companies.find(c => String(c.id) === String(id))?.nombre || '';
  const getCategoriaName = (id) => categories.find(c => String(c.id) === String(id))?.nombre || '';

  return (
    <div className="grid-2">
      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>📋</span> <span id="s1-card-title">Selecciona la vacante a publicar</span>
            </div>
          </div>
          <div className="card-body">
            <div className="tabs">
              <div 
                className={`tab ${activeTab === 'existing' ? 'active' : ''}`} 
                onClick={() => setActiveTab('existing')}
              >
                Vacantes existentes
              </div>
              <div 
                className={`tab ${activeTab === 'new' ? 'active' : ''}`} 
                onClick={() => setActiveTab('new')}
              >
                + Crear nueva vacante
              </div>
            </div>

            {activeTab === 'existing' && (
              <div id="s1-existente">
                <div className="filter-bar">
                  <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input 
                      className="filter-search" 
                      placeholder="Buscar por nombre, código o empresa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    className={`filter-btn ${statusFilter === 'Todas' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('Todas')}
                  >Todas</button>
                  <button 
                    className={`filter-btn ${statusFilter === 'Activas' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('Activas')}
                  >Activas</button>
                  <button 
                    className={`filter-btn ${statusFilter === 'Sin publicar' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('Sin publicar')}
                  >Sin publicar</button>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">Cargando vacantes...</div>
                ) : filteredVacancies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No se encontraron vacantes</div>
                ) : (
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Empresa</th>
                        <th>Categoría</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVacancies.map((vacancy) => (
                        <tr 
                          key={vacancy.id} 
                          className={selectedVacancy?.id === vacancy.id ? 'selected' : ''}
                          onClick={() => setSelectedVacancy(vacancy)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <input 
                              type="radio" 
                              name="vac" 
                              checked={selectedVacancy?.id === vacancy.id} 
                              readOnly
                              style={{ accentColor: 'var(--purple)' }} 
                            />
                          </td>
                          <td>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 600, color: 'var(--purple)' }}>
                              #{vacancy.codigo}
                            </span>
                          </td>
                          <td>
                            <div className="portal-name">{vacancy.nombre}</div>
                            <div className="portal-country">{vacancy.empresa?.nombre} · {vacancy.categoria?.nombre}</div>
                          </td>
                          <td>{vacancy.empresa?.nombre}</td>
                          <td>{vacancy.categoria?.nombre}</td>
                          <td>
                            <span className={`tag ${
                              vacancy.estado?.toLowerCase() === 'vigente' || vacancy.estado?.toLowerCase() === 'activa' ? 'tag-gratis' : 'tag-pago'
                            }`}>
                              {vacancy.estado || 'Borrador'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'new' && (
              <div id="s1-nueva">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F5F0FC', border: '1px solid #D8CCF0', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '18px' }}>🔢</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>Código asignado automáticamente</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'DM Mono',monospace", color: 'var(--purple)', letterSpacing: '1px' }}>#405</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="field-group" style={{ gridColumn: '1/-1' }}>
                    <div className="field-label">Nombre de la vacante <span style={{ color: '#EF4444' }}>*</span></div>
                    <input 
                      {...register('nombre', { required: true })} 
                      className="field-input" 
                      placeholder="Ej. Gerente de Ventas Regional" 
                    />
                  </div>

                  <div className="field-group">
                    <div className="field-label">Empresa <span style={{ color: '#EF4444' }}>*</span></div>
                    <select {...register('empresa_id', { required: true })} className="field-select">
                      <option value="" disabled>Selecciona empresa</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field-group">
                    <div className="field-label">Categoría <span style={{ color: '#EF4444' }}>*</span></div>
                    <select {...register('categoria_id', { required: true })} className="field-select">
                      <option value="" disabled>Selecciona categoría</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field-group" style={{ gridColumn: '1/-1' }}>
                    <div className="field-label">Estado <span style={{ color: '#EF4444' }}>*</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', border: `1.5px solid ${watchEstado === 'Borrador' ? 'var(--purple)' : 'var(--border)'}`, borderRadius: '8px', cursor: 'pointer', background: watchEstado === 'Borrador' ? '#F5F0FC' : 'transparent' }}>
                        <input type="radio" value="Borrador" {...register('estado')} style={{ accentColor: 'var(--purple)' }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>Borrador</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Guardado, no visible aún</div>
                        </div>
                        <span className="tag tag-pago" style={{ marginLeft: 'auto' }}>Borrador</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', border: `1.5px solid ${watchEstado === 'Vigente' ? 'var(--purple)' : 'var(--border)'}`, borderRadius: '8px', cursor: 'pointer', background: watchEstado === 'Vigente' ? '#F0FDF8' : 'transparent' }}>
                        <input type="radio" value="Vigente" {...register('estado')} style={{ accentColor: 'var(--purple)' }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>Vigente</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Activa y lista para publicar</div>
                        </div>
                        <span className="tag tag-gratis" style={{ marginLeft: 'auto' }}>Vigente</span>
                      </label>
                      
                    </div>
                  </div>
                </div>

                <div className="btn-row">
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('existing')}>← Ver vacantes existentes</button>
                  <button className="btn btn-outline btn-sm" onClick={handleSubmit((d) => onCreateVacancy(d, false))}>💾 Guardar como borrador</button>
                  <button className="btn btn-primary btn-sm" onClick={handleSubmit((d) => onCreateVacancy(d, true))}>Guardar y continuar →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div>
        <div className="card summary-card">
          <div className="card-header">
            <div className="card-title"><span>📌</span> <span>Vacante seleccionada</span></div>
          </div>
          <div className="card-body">
            {activeTab === 'existing' && (
              selectedVacancy ? (
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--purple)', fontFamily: "'DM Mono',monospace", marginBottom: '4px' }}>#{selectedVacancy.codigo}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{selectedVacancy.nombre}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
                    {selectedVacancy.empresa?.nombre} · {selectedVacancy.categoria?.nombre} · {selectedVacancy.estado}
                  </div>
                  <hr className="divider" />
                  <div className="field-group">
                    <div className="field-label">Empresa</div>
                    <div style={{ fontWeight: 600 }}>{selectedVacancy.empresa?.nombre}</div>
                  </div>
                  <div className="btn-row">
                    <button className="btn btn-primary" onClick={() => setStep(2)}>Continuar →</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
                  Selecciona una vacante de la lista para continuar.
                </div>
              )
            )}

            {activeTab === 'new' && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '8px' }}>Vista previa</div>

                <div style={{ background: '#F5F0FC', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'DM Mono',monospace", color: 'var(--purple)' }}>#405</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '6px', minHeight: '20px' }}>
                    {watchNombre || <span style={{ color: 'var(--muted)', fontWeight: 400, fontStyle: 'italic', fontSize: '12px' }}>Nombre del cargo...</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', minHeight: '16px' }}>
                    {getEmpresaName(watchEmpresaId)} {watchCategoriaId ? `· ${getCategoriaName(watchCategoriaId)}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Estado:</div>
                  <span className={`tag ${watchEstado === 'Vigente' ? 'tag-gratis' : 'tag-pago'}`}>{watchEstado}</span>
                </div>

                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '8px' }}>Campos requeridos</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: watchNombre ? 'var(--teal)' : '#D1D5DB', fontSize: '14px' }}>{watchNombre ? '✔' : '○'}</span> Nombre de la vacante
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: watchEmpresaId ? 'var(--teal)' : '#D1D5DB', fontSize: '14px' }}>{watchEmpresaId ? '✔' : '○'}</span> Empresa
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: watchCategoriaId ? 'var(--teal)' : '#D1D5DB', fontSize: '14px' }}>{watchCategoriaId ? '✔' : '○'}</span> Categoría
                  </div>
                </div>

                <div className="btn-row" style={{ flexDirection: 'column', marginTop: '20px' }}>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSubmit((d) => onCreateVacancy(d, true))}>Guardar y continuar →</button>
                  <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSubmit((d) => onCreateVacancy(d, false))}>💾 Solo guardar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
