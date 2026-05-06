import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { usePublicationStore } from '../../store/publicationStore';
import { profilesApi } from '../../services/api';

export default function Step2Profile() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [prevTab, setPrevTab] = useState('generic');

  const { selectedProfile, setSelectedProfile, setStep } = usePublicationStore();
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      titulo_anuncio: '',
      categoria: 'Ventas',
      tipo_jornada: 'Tiempo completo · Turno rotativo',
      salario: 'MX$ 8,000 – 10,500',
      ubicacion: 'Ciudad de México, MX',
      descripcion: '',
      requisitos: ''
    }
  });

  const watchValues = watch();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const data = await profilesApi.getAll();
      setProfiles(data);
    } catch (error) {
      toast.error('Error al cargar los perfiles');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    try {
      const result = await profilesApi.generateWithAI({
        descripcion_puesto: watchValues.titulo_anuncio || 'Vendedor'
      });
      
      setValue('descripcion', result.descripcion || 'El vendedor es responsable de brindar una atención cálida, rápida y eficiente al cliente, garantizando una experiencia de compra memorable. Maneja el punto de venta, exhibición de productos y trabajo en equipo.');
      setValue('requisitos', '• Secundaria terminada (deseable bachillerato)\n• Actitud de servicio y trabajo en equipo\n• Disponibilidad de horario (incluye fines de semana)\n• No se requiere experiencia previa, se capacita');
      setAiSuggestions(result.suggestions || ['Rango salarial visible para atraer +40% más candidatos', 'Beneficios: prestaciones de ley, capacitación, crecimiento']);
      
      toast.success('Descripción generada con IA');
    } catch (error) {
      toast.error('Error al generar con IA');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleContinue = async () => {
    if (!watchValues.titulo_anuncio || !watchValues.descripcion) {
      toast.error('Por favor completa el título y la descripción');
      return;
    }
    
    try {
      const created = await profilesApi.create(watchValues);
      setSelectedProfile(created);
      setStep(3);
    } catch (error) {
      toast.error('Error al guardar el perfil');
    }
  };

  const loadProfile = (profile) => {
    setValue('titulo_anuncio', profile.titulo_anuncio);
    setValue('descripcion', profile.descripcion);
    toast.success('Perfil cargado');
  };

  return (
    <div className="grid-2">
      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span>✨</span> Perfil del candidato</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm btn-ai" onClick={handleGenerateAI} disabled={generatingAI}>
                {generatingAI ? 'Generando...' : '✦ Generar con IA'}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => setPreviewOpen(true)} title="Ver cómo se verá el aviso publicado">👁 Previsualizar aviso</button>
            </div>
          </div>
          <div className="card-body">

            {/* AI BANNER */}
            <div className="ai-banner">
              <div className="ai-icon">✦</div>
              <div className="ai-text">
                <strong>Sofi IA · Asistente de perfiles</strong>
                <p>Puedo generar automáticamente el perfil ideal para esta vacante basándome en la descripción del puesto, sector y empresa. También puedo optimizar la redacción para cada portal.</p>
                <div className="ai-chips">
                  <div className="ai-chip selected">Ventas retail</div>
                  <div className="ai-chip">Atención al cliente</div>
                  <div className="ai-chip">Mostrador / pastelería</div>
                  <div className="ai-chip selected">Sin experiencia requerida</div>
                  <div className="ai-chip">Turno rotativo</div>
                </div>
              </div>
            </div>

            <div className="field-group">
              <div className="field-label">Título del anuncio</div>
              <input {...register('titulo_anuncio')} className="field-input" placeholder="Ej. Vendedor(a) de Mostrador – Pastelería SKIC" />
              <div className="field-hint">Este es el título que verán los candidatos en los portales</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="field-group">
                <div className="field-label">Categoría</div>
                <select {...register('categoria')} className="field-select">
                  <option>Ventas</option>
                  <option>Atención al cliente</option>
                  <option>Comercio / Retail</option>
                </select>
              </div>
              <div className="field-group">
                <div className="field-label">Tipo de jornada</div>
                <select {...register('tipo_jornada')} className="field-select">
                  <option>Tiempo completo</option>
                  <option>Tiempo completo · Turno rotativo</option>
                  <option>Medio tiempo</option>
                </select>
              </div>
              <div className="field-group">
                <div className="field-label">Salario (rango)</div>
                <input {...register('salario')} className="field-input" placeholder="Ej. MX$ 8,000 – 10,000" />
              </div>
              <div className="field-group">
                <div className="field-label">Ubicación</div>
                <input {...register('ubicacion')} className="field-input" placeholder="Ciudad de México, MX" />
              </div>
            </div>

            <div className="field-group">
              <div className="field-label">Descripción del puesto</div>
              <div className="textarea-wrap">
                <textarea {...register('descripcion')} className="field-textarea" style={{ minHeight: '120px' }}></textarea>
                <div className="ai-badge">✦ IA</div>
              </div>
              <div className="annotation">Texto generado por Sofi IA · puedes editarlo libremente</div>
            </div>

            <div className="field-group">
              <div className="field-label">Requisitos</div>
              <textarea {...register('requisitos')} className="field-textarea"></textarea>
            </div>

            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Regresar</button>
              <button className="btn btn-outline" onClick={() => setPreviewOpen(true)}>👁 Previsualizar aviso</button>
              <button className="btn btn-primary" onClick={handleContinue}>Continuar → Seleccionar portales</button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="card summary-card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <div className="card-title"><span>💡</span> Sugerencias IA</div>
          </div>
          <div className="card-body" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>Sofi recomienda incluir:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {aiSuggestions.length > 0 ? aiSuggestions.map((sug, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px' }}>
                  <span style={{ color: 'var(--teal)', fontSize: '14px' }}>✔</span>
                  <span>{sug}</span>
                </div>
              )) : (
                <>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px' }}>
                    <span style={{ color: 'var(--teal)', fontSize: '14px' }}>✔</span>
                    <span>Rango salarial visible para atraer +40% más candidatos</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px' }}>
                    <span style={{ color: 'var(--teal)', fontSize: '14px' }}>✔</span>
                    <span>Beneficios: prestaciones de ley, capacitación, crecimiento</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px' }}>
                    <span style={{ color: '#F59E0B', fontSize: '14px' }}>⚠</span>
                    <span>Añadir horario específico mejora conversión en portales operativos</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px' }}>
                    <span style={{ color: '#EF4444', fontSize: '14px' }}>✗</span>
                    <span>Evitar "sin experiencia" como requisito negativo</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><span>📂</span> Perfiles guardados</div>
          </div>
          <div className="card-body" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>Reutiliza perfiles de campañas anteriores:</div>
            {loading ? (
               <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Cargando...</div>
            ) : profiles.length === 0 ? (
               <div style={{ fontSize: '12px', color: 'var(--muted)' }}>No hay perfiles guardados.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {profiles.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => loadProfile(p)}
                    style={{ padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: '8px', cursor: 'pointer', transition: 'all .15s' }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--purple)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ fontWeight: 600, fontSize: '12px' }}>{p.titulo_anuncio}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Usado en {p.usage_count || 1} campañas</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewOpen && (
        <div className="modal-overlay open">
          <div className="modal" style={{ width: '720px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            
            <div className="modal-header" style={{ background: '#F8F9FB', flexShrink: 0, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>👁</div>
                <div>
                  <div className="modal-title" style={{ color: 'var(--text)' }}>Previsualización del aviso</div>
                  <div className="modal-sub" style={{ color: 'var(--muted)' }}>Así verán los candidatos tu publicación en los portales</div>
                </div>
              </div>
              <button onClick={() => setPreviewOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', color: 'var(--muted)', cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: '12px 24px 0', borderBottom: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0, overflowX: 'auto' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', marginRight: '14px', whiteSpace: 'nowrap' }}>Vista portal:</div>
              <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none', gap: 0, flexWrap: 'nowrap' }}>
                <div className={`tab ${prevTab === 'generic' ? 'active' : ''}`} onClick={() => setPrevTab('generic')} style={{ whiteSpace: 'nowrap' }}>📄 Genérico</div>
                <div className={`tab ${prevTab === 'occ' ? 'active' : ''}`} onClick={() => setPrevTab('occ')} style={{ whiteSpace: 'nowrap' }}>OCC Mundial</div>
                <div className={`tab ${prevTab === 'computrabajo' ? 'active' : ''}`} onClick={() => setPrevTab('computrabajo')} style={{ whiteSpace: 'nowrap' }}>Computrabajo</div>
                <div className={`tab ${prevTab === 'linkedin' ? 'active' : ''}`} onClick={() => setPrevTab('linkedin')} style={{ whiteSpace: 'nowrap' }}>LinkedIn</div>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '24px', background: '#F0F2F5' }}>
              {prevTab === 'generic' && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', maxWidth: '640px', margin: '0 auto', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                  <div style={{ background: 'var(--purple)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#fff' }}>S</div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 600 }}>Empresa</div>
                      <div style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>SKIC</div>
                    </div>
                  </div>
                  <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginBottom: '10px' }}>{watchValues.titulo_anuncio || 'Título del anuncio'}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--muted)' }}>📍 {watchValues.ubicacion}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--muted)' }}>🕐 {watchValues.tipo_jornada}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: 'var(--teal-dark)' }}>💰 {watchValues.salario}</span>
                    </div>
                  </div>
                  <div style={{ padding: '22px 24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Descripción del puesto</div>
                    <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, marginBottom: '18px', whiteSpace: 'pre-wrap' }}>{watchValues.descripcion}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Requisitos</div>
                    <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.9, paddingLeft: '18px', marginBottom: '18px', whiteSpace: 'pre-wrap' }}>{watchValues.requisitos}</div>
                  </div>
                </div>
              )}
              {prevTab !== 'generic' && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                  Vista simulada de {prevTab} (Mapeado a la estructura CSS del HTML de origen)
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
