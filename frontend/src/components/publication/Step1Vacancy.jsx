import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { vacanciesApi, companiesApi, categoriesApi } from '../../services/api';
import { usePublicationStore } from '../../store/publicationStore';

export default function Step1Vacancy() {
  const { t } = useAppSettings();
  const [activeTab, setActiveTab] = useState('existing');
  const [vacancies, setVacancies] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { selectedVacancy, setSelectedVacancy, setStep } = usePublicationStore();

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      estado: 'borrador',
      descripcion: '',
      direccion: '',
    },
  });

  const watchNombre = watch('nombre');
  const watchEmpresaId = watch('empresa_id');
  const watchCategoriaId = watch('categoria_id');
  const watchEstado = watch('estado');

  const getNextVacancyCode = () => {
    const maxNumber = vacancies.reduce((max, vacancy) => {
      const match = String(vacancy.codigo || '').match(/VAC-(\d+)/i);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    return `VAC-${String(maxNumber + 1).padStart(3, '0')}`;
  };

  const nextVacancyCode = getNextVacancyCode();

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
      toast.error(t('loadingVacancies'));
    } finally {
      setLoading(false);
    }
  };

  const findCompanyByName = (name) =>
    companies.find((c) => c.nombre.toLowerCase() === String(name || '').trim().toLowerCase());

  const findCategoryByName = (name) =>
    categories.find((c) => c.nombre.toLowerCase() === String(name || '').trim().toLowerCase());

  const ensureCompanyId = async (currentId) => {
    if (currentId) return currentId;
    const name = newCompanyName.trim();
    if (!name) return '';
    const existing = findCompanyByName(name);
    if (existing) return existing.id;
    const created = await companiesApi.create({ nombre: name, pais: 'MX' });
    setCompanies((current) => [...current, created]);
    setNewCompanyName('');
    return created.id;
  };

  const ensureCategoryId = async (currentId) => {
    if (currentId) return currentId;
    const name = newCategoryName.trim();
    if (!name) return '';
    const existing = findCategoryByName(name);
    if (existing) return existing.id;
    const created = await categoriesApi.create({ nombre: name, slug: slugify(name), orden: categories.length + 1 });
    setCategories((current) => [...current, created]);
    setNewCategoryName('');
    return created.id;
  };

  const onCreateVacancy = async (data, goToNext) => {
    try {
      const empresaId = await ensureCompanyId(data.empresa_id);
      const categoriaId = await ensureCategoryId(data.categoria_id);

      if (!empresaId || !categoriaId) {
        toast.error(t('requiredField'));
        return;
      }

      const created = await vacanciesApi.create({
        ...data,
        empresa_id: empresaId,
        categoria_id: categoriaId,
        codigo: nextVacancyCode,
        descripcion: data.descripcion || data.nombre,
        direccion: data.direccion || 'Sin direccion',
      });
      setVacancies([...vacancies, created]);
      setSelectedVacancy(created);
      toast.success(t('saveAndContinue'));

      if (goToNext) {
        setStep(2);
      } else {
        setActiveTab('existing');
      }
    } catch (error) {
      toast.error(t('createVacancyError'));
    }
  };

  const slugify = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const createCompany = async () => {
    const name = newCompanyName.trim();
    if (!name) return;
    try {
      const existing = findCompanyByName(name);
      const created = existing || await companiesApi.create({ nombre: name, pais: 'MX' });
      if (!existing) setCompanies((current) => [...current, created]);
      setValue('empresa_id', created.id, { shouldValidate: true });
      setNewCompanyName('');
    } catch (error) {
      toast.error(t('credentialsSaveError'));
    }
  };

  const createCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const existing = findCategoryByName(name);
      const created = existing || await categoriesApi.create({ nombre: name, slug: slugify(name), orden: categories.length + 1 });
      if (!existing) setCategories((current) => [...current, created]);
      setValue('categoria_id', created.id, { shouldValidate: true });
      setNewCategoryName('');
    } catch (error) {
      toast.error(t('credentialsSaveError'));
    }
  };

  const isActiveVacancy = (vacancy) => {
    const status = vacancy.estado?.toLowerCase();
    return status === 'activa' || status === 'activo' || status === 'vigente' || status === 'active';
  };

  const filteredVacancies = vacancies.filter((v) => {
    const matchesSearch = v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || String(v.codigo).includes(searchTerm);
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && isActiveVacancy(v);
    if (statusFilter === 'unpublished') return matchesSearch && !isActiveVacancy(v);
    return matchesSearch;
  });

  const getEmpresaName = (id) => companies.find((c) => String(c.id) === String(id))?.nombre || '';
  const getCategoriaName = (id) => categories.find((c) => String(c.id) === String(id))?.nombre || '';

  return (
    <div className="grid-2">
      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>📋</span> <span id="s1-card-title">{t('selectVacancyTitle')}</span>
            </div>
          </div>
          <div className="card-body">
            <div className="tabs">
              <div
                className={`tab ${activeTab === 'existing' ? 'active' : ''}`}
                onClick={() => setActiveTab('existing')}
              >
                {t('existingVacancies')}
              </div>
              <div
                className={`tab ${activeTab === 'new' ? 'active' : ''}`}
                onClick={() => setActiveTab('new')}
              >
                {t('createNewVacancy')}
              </div>
            </div>

            {activeTab === 'existing' && (
              <div id="s1-existente">
                <div className="filter-bar">
                  <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                      className="filter-search"
                      placeholder={t('searchVacancyPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>{t('all')}</button>
                  <button className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`} onClick={() => setStatusFilter('active')}>{t('active')}</button>
                  <button className={`filter-btn ${statusFilter === 'unpublished' ? 'active' : ''}`} onClick={() => setStatusFilter('unpublished')}>{t('unpublished')}</button>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-text-muted">{t('loadingVacancies')}</div>
                ) : filteredVacancies.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">{t('noVacanciesFound')}</div>
                ) : (
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>{t('code')}</th>
                        <th>{t('name')}</th>
                        <th>{t('company')}</th>
                        <th>{t('category')}</th>
                        <th>{t('status')}</th>
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
                            <div className="portal-country">{vacancy.empresa?.nombre || getEmpresaName(vacancy.empresa_id)} - {vacancy.categoria?.nombre || getCategoriaName(vacancy.categoria_id)}</div>
                          </td>
                          <td>{vacancy.empresa?.nombre || getEmpresaName(vacancy.empresa_id)}</td>
                          <td>{vacancy.categoria?.nombre || getCategoriaName(vacancy.categoria_id)}</td>
                          <td>
                            <span className={`tag ${
                              isActiveVacancy(vacancy) ? 'tag-gratis' : 'tag-pago'
                            }`}>
                              {vacancy.estado || t('draft')}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="field-group" style={{ gridColumn: '1/-1' }}>
                    <div className="field-label">{t('vacancyName')} <span style={{ color: '#EF4444' }}>*</span></div>
                    <input {...register('nombre', { required: true })} className="field-input" placeholder={t('vacancyNamePlaceholder')} />
                  </div>

                  <div className="field-group">
                    <div className="field-label">{t('company')} <span style={{ color: '#EF4444' }}>*</span></div>
                    <input type="hidden" {...register('empresa_id')} />
                    <input
                      list="companies-list"
                      className="field-input"
                      placeholder={t('selectCompany')}
                      value={newCompanyName || getEmpresaName(watchEmpresaId)}
                      onChange={(e) => {
                        const value = e.target.value;
                        const existing = findCompanyByName(value);
                        setNewCompanyName(existing ? '' : value);
                        setValue('empresa_id', existing?.id || '', { shouldValidate: true });
                      }}
                      onBlur={createCompany}
                    />
                    <datalist id="companies-list">
                      {companies.map((c) => <option key={c.id} value={c.nombre} />)}
                    </datalist>
                  </div>

                  <div className="field-group">
                    <div className="field-label">{t('category')} <span style={{ color: '#EF4444' }}>*</span></div>
                    <input type="hidden" {...register('categoria_id')} />
                    <input
                      list="categories-list"
                      className="field-input"
                      placeholder={t('selectCategory')}
                      value={newCategoryName || getCategoriaName(watchCategoriaId)}
                      onChange={(e) => {
                        const value = e.target.value;
                        const existing = findCategoryByName(value);
                        setNewCategoryName(existing ? '' : value);
                        setValue('categoria_id', existing?.id || '', { shouldValidate: true });
                      }}
                      onBlur={createCategory}
                    />
                    <datalist id="categories-list">
                      {categories.map((c) => <option key={c.id} value={c.nombre} />)}
                    </datalist>
                  </div>

                  <div className="field-group" style={{ gridColumn: '1/-1' }}>
                    <div className="field-label">{t('jobDescription')} <span style={{ color: '#EF4444' }}>*</span></div>
                    <textarea {...register('descripcion', { required: true })} className="field-textarea" />
                  </div>

                  <div className="field-group" style={{ gridColumn: '1/-1' }}>
                    <div className="field-label">{t('location')} <span style={{ color: '#EF4444' }}>*</span></div>
                    <input {...register('direccion', { required: true })} className="field-input" placeholder="Ciudad de Mexico, MX" />
                  </div>

                  <div className="field-group" style={{ gridColumn: '1/-1' }}>
                    <div className="field-label">{t('status')} <span style={{ color: '#EF4444' }}>*</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', border: `1.5px solid ${watchEstado === 'borrador' ? 'var(--color-purple)' : 'var(--color-border-main)'}`, borderRadius: '8px', cursor: 'pointer', background: watchEstado === 'borrador' ? 'var(--color-purple-light)' : 'transparent', color: 'var(--color-text-main)' }}>
                        <input type="radio" value="borrador" {...register('estado')} style={{ accentColor: 'var(--purple)' }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{t('draft')}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{t('draftHelp')}</div>
                        </div>
                        <span className="tag tag-pago" style={{ marginLeft: 'auto' }}>{t('draft')}</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', border: `1.5px solid ${watchEstado === 'vigente' ? 'var(--color-purple)' : 'var(--color-border-main)'}`, borderRadius: '8px', cursor: 'pointer', background: watchEstado === 'vigente' ? 'var(--color-teal-light)' : 'transparent', color: 'var(--color-text-main)' }}>
                        <input type="radio" value="vigente" {...register('estado')} style={{ accentColor: 'var(--purple)' }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{t('current')}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{t('currentHelp')}</div>
                        </div>
                        <span className="tag tag-gratis" style={{ marginLeft: 'auto' }}>{t('current')}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="btn-row">
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('existing')}>← {t('viewExistingVacancies')}</button>
                  <button className="btn btn-outline btn-sm" onClick={handleSubmit((d) => onCreateVacancy(d, false))}>💾 {t('saveDraft')}</button>
                  <button className="btn btn-primary btn-sm" onClick={handleSubmit((d) => onCreateVacancy(d, true))}>{t('saveAndContinue')} →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="card summary-card">
          <div className="card-header">
            <div className="card-title"><span>📌</span> <span>{t('selectedVacancy')}</span></div>
          </div>
          <div className="card-body">
            {activeTab === 'existing' && (
              selectedVacancy ? (
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--purple)', fontFamily: "'DM Mono',monospace", marginBottom: '4px' }}>#{selectedVacancy.codigo}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{selectedVacancy.nombre}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
                    {selectedVacancy.empresa?.nombre || getEmpresaName(selectedVacancy.empresa_id)} - {selectedVacancy.categoria?.nombre || getCategoriaName(selectedVacancy.categoria_id)} - {selectedVacancy.estado}
                  </div>
                  <hr className="divider" />
                  <div className="field-group">
                    <div className="field-label">{t('company')}</div>
                    <div style={{ fontWeight: 600 }}>{selectedVacancy.empresa?.nombre || getEmpresaName(selectedVacancy.empresa_id)}</div>
                  </div>
                  <div className="btn-row">
                    <button className="btn btn-primary" onClick={() => setStep(2)}>{t('continue')} →</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
                  {t('selectVacancyToContinue')}
                </div>
              )
            )}

            {activeTab === 'new' && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '8px' }}>{t('preview')}</div>

                <div style={{ background: 'var(--color-purple-light)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, minHeight: '20px' }}>
                    {watchNombre || <span style={{ color: 'var(--muted)', fontWeight: 400, fontStyle: 'italic', fontSize: '12px' }}>{t('jobNamePlaceholder')}</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', minHeight: '16px' }}>
                    {getEmpresaName(watchEmpresaId)} {watchCategoriaId ? `- ${getCategoriaName(watchCategoriaId)}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{t('status')}:</div>
                  <span className={`tag ${watchEstado === 'vigente' ? 'tag-gratis' : 'tag-pago'}`}>{watchEstado === 'vigente' ? t('current') : t('draft')}</span>
                </div>

                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '8px' }}>{t('requiredFields')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: watchNombre ? 'var(--teal)' : '#D1D5DB', fontSize: '14px' }}>{watchNombre ? '✓' : '○'}</span> {t('vacancyName')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: watchEmpresaId ? 'var(--teal)' : '#D1D5DB', fontSize: '14px' }}>{watchEmpresaId ? '✓' : '○'}</span> {t('company')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: watchCategoriaId ? 'var(--teal)' : '#D1D5DB', fontSize: '14px' }}>{watchCategoriaId ? '✓' : '○'}</span> {t('category')}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
