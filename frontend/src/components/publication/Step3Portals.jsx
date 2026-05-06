import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { usePublicationStore } from '../../store/publicationStore';
import { portalsApi } from '../../services/api';

const countriesList = [
  { code: 'MX', name: 'México', flag: '🇲🇽', count: 9 },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', count: 4 },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳', count: 8 },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', count: 7 },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', count: 8 },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', count: 5 },
  { code: 'GLOBAL', name: 'Global / Regional', flag: '🌎', count: 4 },
];

export default function Step3Portals() {
  const [portals, setPortals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const {
    selectedCountries,
    setSelectedCountries,
    selectedPortals,
    togglePortal,
    setStep,
  } = usePublicationStore();

  // Asegurar que haya al menos un país por defecto
  useEffect(() => {
    if (selectedCountries.length === 0) {
      setSelectedCountries(['MX']);
    }
  }, []);

  useEffect(() => {
    fetchPortals();
  }, []);

  const fetchPortals = async () => {
    setLoading(true);
    try {
      const data = await portalsApi.getAll();
      setPortals(data);
    } catch (error) {
      toast.error('Error al cargar los portales');
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (code, e) => {
    if (e) e.stopPropagation();
    if (selectedCountries.includes(code)) {
      if (selectedCountries.length > 1) {
        setSelectedCountries(selectedCountries.filter((c) => c !== code));
      } else {
        toast.error('Debe haber al menos un país seleccionado');
      }
    } else {
      setSelectedCountries([...selectedCountries, code]);
    }
  };

  const selectAllCountries = (e) => {
    e.stopPropagation();
    setSelectedCountries(countriesList.map(c => c.code));
  };

  const clearAllCountries = (e) => {
    e.stopPropagation();
    setSelectedCountries(['MX']);
  };

  const autoSelect = () => {
    const recommended = portals.filter(p => ['OCCMundial', 'Portal del Empleo', 'Computrabajo MX'].some(rec => p.nombre.includes(rec)));
    recommended.forEach(p => {
      if (!selectedPortals.some(sp => sp.id === p.id)) {
        togglePortal(p);
      }
    });
    toast.success('Selección IA aplicada');
  };

  const filteredPortals = portals.filter((p) => {
    // Show portal if its 'paises' array includes any of the selected countries OR if the portal is GLOBAL
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

  const countryNamesStr = selectedCountries.map(c => countriesList.find(x => x.code === c)?.name).join(', ');

  return (
    <div className="grid-2">
      <div>
        <div className="card" style={{ overflow: 'visible' }}>
          <div className="card-header" style={{ borderTopLeftRadius: '11px', borderTopRightRadius: '11px' }}>
            <div className="card-title">
              <span>🌐</span> Seleccionar portales de publicación
              <div className="badge">{selectedPortals.length}</div>
            </div>
            <button className="btn btn-sm btn-ai" onClick={autoSelect}>✦ Selección inteligente IA</button>
          </div>
          <div className="card-body" style={{ padding: '16px' }}>

            <div className="info-box">
              ℹ️ <span>Sofi IA recomienda publicar en <strong>portales gratuitos primero</strong> para maximizar alcance sin costo. Los portales de pago incrementan visibilidad en perfiles más específicos.</span>
            </div>

            {/* COUNTRY SELECTOR */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <div 
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', background: '#fff', cursor: 'pointer', userSelect: 'none' }}
              >
                <span style={{ fontSize: '14px' }}>🌍</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', lineHeight: 1 }}>Países de publicación</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {countryNamesStr || 'Seleccione'}
                  </div>
                </div>
                <span style={{ background: 'var(--purple)', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '20px', padding: '1px 7px', flexShrink: 0 }}>
                  {selectedCountries.length}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '12px', transition: 'transform .2s', flexShrink: 0, transform: showCountryDropdown ? 'rotate(180deg)' : 'none' }}>▼</span>
              </div>

              {showCountryDropdown && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1.5px solid var(--purple)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(107,63,160,.15)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F5F0FC', borderBottom: '1px solid #E0D4F5' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--purple-dark)' }}>Selecciona uno o más países</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={selectAllCountries} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--purple)', background: 'none', border: '1px solid var(--purple)', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>Todos</button>
                      <button onClick={clearAllCountries} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>Limpiar</button>
                    </div>
                  </div>

                  <div style={{ padding: '6px 0', maxHeight: '300px', overflowY: 'auto' }}>
                    {countriesList.map(c => {
                      const isSelected = selectedCountries.includes(c.code);
                      return (
                        <div 
                          key={c.code}
                          onClick={(e) => toggleCountry(c.code, e)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', cursor: 'pointer', background: isSelected ? '#F9FAFB' : 'transparent' }}
                        >
                          <span style={{ fontSize: '16px' }}>{c.flag}</span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{c.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '6px' }}>{c.count} portales</span>
                          </div>
                          <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--purple)' : 'var(--border)'}`, background: isSelected ? 'var(--purple)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', background: '#FAFAFA', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowCountryDropdown(false)} className="btn btn-primary btn-sm" style={{ fontSize: '11px' }}>Aplicar ✓</button>
                  </div>
                </div>
              )}
            </div>

            <div className="filter-bar">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input 
                  className="filter-search" 
                  placeholder="Buscar portal..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className={`filter-btn ${filterTab === 'todos' ? 'active' : ''}`} onClick={() => setFilterTab('todos')}>Todos</button>
              <button className={`filter-btn ${filterTab === 'gratis' ? 'active' : ''}`} onClick={() => setFilterTab('gratis')}>Solo gratis</button>
              <button className={`filter-btn ${filterTab === 'pago' ? 'active' : ''}`} onClick={() => setFilterTab('pago')}>De pago</button>
              <button className={`filter-btn ${filterTab === 'freemium' ? 'active' : ''}`} onClick={() => setFilterTab('freemium')}>Freemium</button>
            </div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Cargando portales...</div>
            ) : filteredPortals.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>No se encontraron portales para estos filtros.</div>
            ) : (
              <table className="portal-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Portal</th>
                    <th>Tipo</th>
                    <th>Modelo empresa</th>
                    <th>Costo est.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPortals.map(portal => {
                    const isSelected = selectedPortals.some(p => p.id === portal.id);
                    return (
                      <tr key={portal.id} className={isSelected ? 'selected' : ''}>
                        <td>
                          <input 
                            type="checkbox" 
                            className="check-portal" 
                            checked={isSelected}
                            onChange={() => togglePortal(portal)}
                          />
                        </td>
                        <td>
                          <div className="portal-name">{portal.nombre}</div>
                          <div className="portal-country">{portal.paises?.join(', ') || 'Global'}</div>
                        </td>
                        <td>
                          <span className={`tag ${portal.modelo === 'gratis' ? 'tag-gratis' : portal.modelo === 'pago' ? 'tag-pago' : 'tag-freemium'}`}>
                            {portal.modelo === 'pago' ? 'Bolsa' : portal.modelo === 'gratis' ? 'Gratis' : 'Freemium'}
                          </span>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{portal.modelo === 'pago' ? 'De paga' : portal.modelo}</td>
                        <td>
                          {portal.modelo === 'pago' ? (
                            <span className="cost-badge">MX$ {portal.costo_estimado?.toLocaleString('es-MX')}</span>
                          ) : (
                            <span className="cost-badge free">Gratis</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <div className="btn-row" style={{ marginTop: '24px' }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← Regresar</button>
              <button className="btn btn-primary" onClick={() => setStep(4)} disabled={selectedPortals.length === 0}>
                Continuar → Revisar y publicar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="card summary-card">
          <div className="card-header">
            <div className="card-title"><span>💰</span> Resumen de costos</div>
          </div>
          <div className="card-body">
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '10px' }}>Portales seleccionados</div>
            {selectedPortals.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>Ningún portal seleccionado</div>
            ) : (
              <div className="selected-chips">
                {selectedPortals.map(p => (
                  <div className="sel-chip" key={p.id}>
                    {p.nombre} <span className="rm" onClick={() => togglePortal(p)}>×</span>
                  </div>
                ))}
              </div>
            )}

            <hr className="divider" />
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '10px' }}>Desglose</div>
            
            <div className="cost-row">
              <span className="label">Portales gratuitos/freemium</span>
              <span className="val free">{freePortalsCount} portales · $0</span>
            </div>

            {selectedPortals.filter(p => p.modelo === 'pago').map(p => (
              <div className="cost-row" key={p.id}>
                <span className="label">{p.nombre}</span>
                <span className="val">MX$ {p.costo_estimado?.toLocaleString('es-MX')}</span>
              </div>
            ))}

            <hr className="divider" />
            <div className="cost-total">
              <span>Total estimado</span>
              <span className="val">MX$ {totalCost.toLocaleString('es-MX')}</span>
            </div>
            <div className="warn-box" style={{ marginTop: '14px', marginBottom: 0 }}>
              ⚠️ <span>Los costos son estimados. El costo final se confirma al publicar en cada portal.</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-header">
            <div className="card-title"><span>✦</span> Recomendación IA</div>
          </div>
          <div className="card-body" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
              Para tu vacante actual, Sofi recomienda priorizar:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--teal)', fontWeight: 700 }}>1°</span>
                <span>OCCMundial · mayor volumen MX operativo</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--teal)', fontWeight: 700 }}>2°</span>
                <span>Computrabajo MX · alcance masivo PYME</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--teal)', fontWeight: 700 }}>3°</span>
                <span>Portal SNE · gratuito, gran cobertura</span>
              </div>
            </div>
            <button className="btn btn-ai btn-sm" style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }} onClick={autoSelect}>
              ✦ Aplicar selección sugerida
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
