import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { portalsApi } from '../../services/api';
import { usePublicationStore } from '../../store/publicationStore';

const countriesList = [
  { code: 'MX', nameEs: 'Mexico', nameEn: 'Mexico', flag: '🇲🇽', count: 9 },
  { code: 'GT', nameEs: 'Guatemala', nameEn: 'Guatemala', flag: '🇬🇹', count: 4 },
  { code: 'HN', nameEs: 'Honduras', nameEn: 'Honduras', flag: '🇭🇳', count: 8 },
  { code: 'SV', nameEs: 'El Salvador', nameEn: 'El Salvador', flag: '🇸🇻', count: 7 },
  { code: 'NI', nameEs: 'Nicaragua', nameEn: 'Nicaragua', flag: '🇳🇮', count: 8 },
  { code: 'CL', nameEs: 'Chile', nameEn: 'Chile', flag: '🇨🇱', count: 4 },
  { code: 'US', nameEs: 'Estados Unidos', nameEn: 'United States', flag: '🇺🇸', count: 5 },
  { code: 'GLOBAL', nameEs: 'Global / Regional', nameEn: 'Global / Regional', flag: '🌎', count: 4 },
];

export default function Step3Portals() {
  const { locale, t } = useAppSettings();
  const [portals, setPortals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    selectedCountries,
    setSelectedCountries,
    selectedPortals,
    togglePortal,
    setStep,
  } = usePublicationStore();

  useEffect(() => {
    fetchPortals();
  }, []);

  const countryName = (country) => (locale === 'en' ? country.nameEn : country.nameEs);

  const fetchPortals = async () => {
    setLoading(true);
    try {
      const data = await portalsApi.getAll();
      setPortals(data);
    } catch (error) {
      toast.error(t('loadingPortals'));
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (code, e) => {
    if (e) e.stopPropagation();
    if (selectedCountries.includes(code)) {
      setSelectedCountries(selectedCountries.filter((c) => c !== code));
    } else {
      setSelectedCountries([...selectedCountries, code]);
    }
  };

  const selectAllCountries = (e) => {
    e.stopPropagation();
    setSelectedCountries(countriesList.map((c) => c.code));
  };

  const clearAllCountries = (e) => {
    e.stopPropagation();
    setSelectedCountries([]);
  };

  const suggestedPortals = portals.filter((p) => {
    const countryMatch = selectedCountries.some((c) => p.paises?.includes(c) || c === 'GLOBAL') || p.paises?.includes('GLOBAL');
    const nameMatch = ['LinkedIn', 'Computrabajo MX', 'OCCMundial', 'Portal del Empleo SNE', 'Computrabajo GT', 'Tecoloco', 'Indeed'].some((rec) => p.nombre.toLowerCase().includes(rec.toLowerCase()));
    return countryMatch && nameMatch;
  });

  const handleSmartAISelection = () => {
    setShowSuggestions(!showSuggestions);
    if (!showSuggestions) {
      toast.success("Sofi AI ha resaltado los portales sugeridos en la lista");
    }
  };

  const filteredPortals = selectedCountries.length === 0 ? [] : portals.filter((p) => {
    const countryMatch = selectedCountries.some((c) => p.paises?.includes(c) || c === 'GLOBAL') || p.paises?.includes('GLOBAL');
    const searchMatch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const typeMatch = filterTab === 'todos' ||
      (filterTab === 'gratis' && p.modelo === 'gratis') ||
      (filterTab === 'pago' && p.modelo === 'pago') ||
      (filterTab === 'freemium' && p.modelo === 'freemium');

    return countryMatch && searchMatch && typeMatch;
  });

  const totalCost = selectedPortals.reduce((sum, p) => sum + (p.costo_estimado || 0), 0);
  const freePortalsCount = selectedPortals.filter((p) => p.modelo === 'gratis' || p.modelo === 'freemium').length;
  const selectedCountryLabels = selectedCountries.map((c) => {
    const country = countriesList.find((x) => x.code === c);
    return country ? `${country.flag} ${countryName(country)}` : c;
  });
  const countryNamesStr = selectedCountryLabels.join(', ');

  return (
    <div className="grid-2">
      <div>
        <div className="card" style={{ overflow: 'visible' }}>
          <div className="card-header" style={{ borderTopLeftRadius: '11px', borderTopRightRadius: '11px' }}>
            <div className="card-title">
              <span>🌐</span> {t('selectPortalsTitle')}
              <div className="badge">{selectedPortals.length}</div>
            </div>
            <button className="btn btn-sm btn-ai" onClick={handleSmartAISelection}>✦ {t('smartAISelection')}</button>
          </div>
          <div className="card-body" style={{ padding: '16px' }}>
            <div className="info-box">ℹ <span>{t('portalsInfo')}</span></div>

            {showSuggestions && (
              <div className="info-box" style={{ background: '#ece6f7', border: '1px solid #6b3fa0', color: '#522b80', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✦</span>
                  <span>Sofi AI ha resaltado los portales sugeridos en la lista. Marca la casilla de los que prefieras usar.</span>
                </div>
                <button onClick={() => setShowSuggestions(false)} style={{ background: 'none', border: 'none', color: '#6b3fa0', fontWeight: 'bold', cursor: 'pointer', marginLeft: 'auto', padding: '0 4px' }}>✕</button>
              </div>
            )}

            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <div
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', border: '1.5px solid var(--color-border-main)', borderRadius: '8px', background: 'var(--color-card)', cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ fontSize: '14px' }}>🌍</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', lineHeight: 1 }}>{t('publicationCountries')}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-main)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {countryNamesStr || t('selectCompany')}
                  </div>
                </div>
                <span style={{ background: 'var(--purple)', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '20px', padding: '1px 7px', flexShrink: 0 }}>
                  {selectedCountries.length}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '12px', transition: 'transform .2s', flexShrink: 0, transform: showCountryDropdown ? 'rotate(180deg)' : 'none' }}>▼</span>
              </div>

              {showCountryDropdown && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: 'var(--color-card)', border: '1.5px solid var(--color-purple)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(107,63,160,.15)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', padding: '8px 12px', background: 'var(--color-purple-light)', borderBottom: '1px solid var(--color-border-main)' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--purple-dark)' }}>{t('selectOneOrMoreCountries')}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={selectAllCountries} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--purple)', background: 'none', border: '1px solid var(--purple)', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>{t('all')}</button>
                      <button onClick={clearAllCountries} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>{t('clear')}</button>
                    </div>
                  </div>

                  <div style={{ padding: '6px 0', maxHeight: '300px', overflowY: 'auto' }}>
                    {countriesList.map((c) => {
                      const isSelected = selectedCountries.includes(c.code);
                      return (
                        <div
                          key={c.code}
                          onClick={(e) => toggleCountry(c.code, e)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', cursor: 'pointer', background: isSelected ? 'var(--color-bg-main)' : 'transparent' }}
                        >
                          <span style={{ fontSize: '18px', lineHeight: 1 }}>{c.flag}</span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)' }}>{countryName(c)}</span>
                            <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '6px' }}>{c.count} {t('portals')}</span>
                          </div>
                          <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--purple)' : 'var(--border)'}`, background: isSelected ? 'var(--purple)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: '8px 12px', borderTop: '1px solid var(--color-border-main)', background: 'var(--color-bg-main)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowCountryDropdown(false)} className="btn btn-primary btn-sm" style={{ fontSize: '11px' }}>{t('apply')} ✓</button>
                  </div>
                </div>
              )}
            </div>

            <div className="filter-bar">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input className="filter-search" placeholder={t('searchPortalPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <button className={`filter-btn ${filterTab === 'todos' ? 'active' : ''}`} onClick={() => setFilterTab('todos')}>{t('all')}</button>
              <button className={`filter-btn ${filterTab === 'gratis' ? 'active' : ''}`} onClick={() => setFilterTab('gratis')}>{t('freeOnly')}</button>
              <button className={`filter-btn ${filterTab === 'pago' ? 'active' : ''}`} onClick={() => setFilterTab('pago')}>{t('paid')}</button>
              <button className={`filter-btn ${filterTab === 'freemium' ? 'active' : ''}`} onClick={() => setFilterTab('freemium')}>Freemium</button>
            </div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>{t('loadingPortals')}</div>
            ) : filteredPortals.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>{t('noPortalsFound')}</div>
            ) : (
              <table className="portal-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>{t('portal')}</th>
                    <th>{t('type')}</th>
                    <th>{t('companyModel')}</th>
                    <th>{t('estimatedCostShort')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPortals.map((portal) => {
                    const isSelected = selectedPortals.some((p) => p.id === portal.id);
                    const isSuggested = suggestedPortals.some((sp) => sp.id === portal.id);
                    const rowStyle = showSuggestions && isSuggested
                      ? { backgroundColor: 'rgba(107, 63, 160, 0.05)', borderLeft: '3px solid #6b3fa0' }
                      : {};
                    return (
                      <tr key={portal.id} className={isSelected ? 'selected' : ''} style={rowStyle}>
                        <td>
                          <input type="checkbox" className="check-portal" checked={isSelected} onChange={() => togglePortal(portal)} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="portal-name">{portal.nombre}</div>
                            {showSuggestions && isSuggested && (
                              <span style={{ fontSize: '10px', padding: '1px 6px', background: '#ece6f7', color: '#6b3fa0', border: '1px solid #6b3fa0', borderRadius: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                                ✦ Sugerido
                              </span>
                            )}
                          </div>
                          <div className="portal-country">{portal.paises?.join(', ') || 'Global'}</div>
                        </td>
                        <td>
                          <span className={`tag ${portal.modelo === 'gratis' ? 'tag-gratis' : portal.modelo === 'pago' ? 'tag-pago' : 'tag-freemium'}`}>
                            {portal.modelo === 'pago' ? t('paidModel') : portal.modelo === 'gratis' ? t('free') : 'Freemium'}
                          </span>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{portal.modelo === 'pago' ? t('paidCompanyModel') : portal.modelo}</td>
                        <td>
                          {portal.modelo === 'pago' ? (
                            <span className="cost-badge">MX$ {portal.costo_estimado?.toLocaleString('es-MX')}</span>
                          ) : (
                            <span className="cost-badge free">{t('free')}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <div className="btn-row" style={{ marginTop: '24px' }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← {t('back')}</button>
              <button className="btn btn-primary" onClick={() => setStep(4)} disabled={selectedPortals.length === 0}>
                {t('continueReviewPublish')} →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="card summary-card">
          <div className="card-header">
            <div className="card-title"><span>💰</span> {t('costSummary')}</div>
          </div>
          <div className="card-body">
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '10px' }}>{t('selectedPortals')}</div>
            {selectedPortals.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>{t('noPortalSelected')}</div>
            ) : (
              <div className="selected-chips">
                {selectedPortals.map((p) => (
                  <div className="sel-chip" key={p.id}>
                    {p.nombre} <span className="rm" onClick={() => togglePortal(p)}>x</span>
                  </div>
                ))}
              </div>
            )}

            <hr className="divider" />
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '10px' }}>{t('breakdown')}</div>

            <div className="cost-row">
              <span className="label">{t('freeFreemiumPortals')}</span>
              <span className="val free">{freePortalsCount} {t('portals')} - $0</span>
            </div>

            {selectedPortals.filter((p) => p.modelo === 'pago').map((p) => (
              <div className="cost-row" key={p.id}>
                <span className="label">{p.nombre}</span>
                <span className="val">MX$ {p.costo_estimado?.toLocaleString('es-MX')}</span>
              </div>
            ))}

            <hr className="divider" />
            <div className="cost-total">
              <span>{t('estimatedTotal')}</span>
              <span className="val">MX$ {totalCost.toLocaleString('es-MX')}</span>
            </div>
            <div className="warn-box" style={{ marginTop: '14px', marginBottom: 0 }}>
              <span>{t('costWarning')}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-header">
            <div className="card-title"><span>✦</span> {t('aiRecommendation')}</div>
          </div>
          <div className="card-body" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
              {t('currentVacancyRecommendation')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              {suggestedPortals.slice(0, 4).map((p, idx) => {
                const isChecked = selectedPortals.some((sp) => sp.id === p.id);
                return (
                  <div 
                    key={p.id}
                    onClick={() => togglePortal(p)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: isChecked ? '#f3ebff' : 'var(--color-bg-main)', border: `1.5px solid ${isChecked ? '#6b3fa0' : 'transparent'}`, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--purple)', fontWeight: 700 }}>{idx + 1}</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{p.nombre}</span>
                      <span style={{ fontSize: '10px', color: 'var(--muted)' }}>({p.paises?.join(', ')})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {p.modelo === 'gratis' ? (
                        <span style={{ fontSize: '10px', color: '#2b8a3e', background: '#ebfbee', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{t('free')}</span>
                      ) : (
                        <span style={{ fontSize: '10px', color: '#e67700', background: '#fff9db', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{t('paid')}</span>
                      )}
                      <span style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1.5px solid ${isChecked ? '#6b3fa0' : 'var(--border)'}`, background: isChecked ? '#6b3fa0' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 700 }}>
                        {isChecked ? '✓' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
              {suggestedPortals.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic', padding: '6px 0' }}>
                  Selecciona un país para ver recomendaciones personalizadas de portales.
                </div>
              )}
            </div>
            <button className="btn btn-ai btn-sm" style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }} onClick={handleSmartAISelection}>
              ✦ {showSuggestions ? 'Ocultar resaltado en lista' : 'Resaltar sugerencias en lista'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
