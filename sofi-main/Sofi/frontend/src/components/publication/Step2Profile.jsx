import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { profilesApi } from '../../services/api';
import { usePublicationStore } from '../../store/publicationStore';

export default function Step2Profile() {
  const { locale, t } = useAppSettings();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const typewriterIntervalsRef = useRef([]);

  const clearAllTypewriters = () => {
    typewriterIntervalsRef.current.forEach(clearInterval);
    typewriterIntervalsRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTypewriters();
  }, []);

  const selectedVacancy = usePublicationStore((state) => state.selectedVacancy);
  const setSelectedProfile = usePublicationStore((state) => state.setSelectedProfile);
  const setStep = usePublicationStore((state) => state.setStep);
  const setDraftProfile = usePublicationStore((state) => state.setDraftProfile);
  const aiSuggestions = usePublicationStore((state) => state.aiSuggestions);
  const setAiSuggestions = usePublicationStore((state) => state.setAiSuggestions);
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: (() => {
      const state = usePublicationStore.getState();
      const draft = state.draftProfile;
      const profile = state.selectedProfile;
      const vacancy = state.selectedVacancy;

      if (draft) {
        return draft;
      }
      if (profile) {
        return {
          titulo_anuncio: profile.titulo_anuncio || '',
          categoria: profile.categoria_id || 'Ventas',
          tipo_jornada: profile.tipo_jornada || 'Tiempo completo',
          moneda_salario: profile.moneda || 'MXN',
          salario: profile.salario || '8,000 - 10,500',
          ubicacion: profile.ubicacion || 'Ciudad de Mexico, MX',
          descripcion: profile.descripcion || '',
          requisitos: Array.isArray(profile.requisitos) ? profile.requisitos.join('\n') : profile.requisitos || '',
        };
      }
      if (vacancy) {
        return {
          titulo_anuncio: vacancy.nombre || '',
          categoria: vacancy.categoria?.nombre || 'Ventas',
          tipo_jornada: 'Tiempo completo',
          moneda_salario: 'MXN',
          salario: '8,000 - 10,500',
          ubicacion: vacancy.direccion || 'Ciudad de Mexico, MX',
          descripcion: vacancy.descripcion || '',
          requisitos: Array.isArray(vacancy.requisitos) ? vacancy.requisitos.join('\n') : vacancy.requisitos || '',
        };
      }
      return {
        titulo_anuncio: '',
        categoria: 'Ventas',
        tipo_jornada: 'Tiempo completo',
        moneda_salario: 'MXN',
        salario: '8,000 - 10,500',
        ubicacion: 'Ciudad de Mexico, MX',
        descripcion: '',
        requisitos: '',
      };
    })(),
  });

  const watchValues = watch();

  useEffect(() => {
    // Save draft profile to store on every change
    const subscription = watch((value) => {
      setDraftProfile(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, setDraftProfile]);
  const currencyOptions = [
    { value: 'MXN', label: 'Peso mexicano', symbol: 'MX$' },
    { value: 'USD', label: 'Dolar', symbol: 'US$' },
    { value: 'CLP', label: 'Peso chileno', symbol: 'CLP$' },
  ];
  const selectedCurrency = currencyOptions.find((currency) => currency.value === watchValues.moneda_salario) || currencyOptions[0];
  const formattedSalary = watchValues.salario ? `${selectedCurrency.symbol} ${watchValues.salario}` : '';

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const data = await profilesApi.getAll();
      setProfiles(data);
    } catch (error) {
      toast.error(t('noSavedProfiles'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    try {
      const currentDesc = watchValues.descripcion;
      const currentReqs = watchValues.requisitos;

      let context = '';
      if (currentDesc && currentDesc.trim()) {
        context += `Descripción actual del puesto:\n${currentDesc.trim()}\n\n`;
      }
      if (currentReqs && currentReqs.trim()) {
        context += `Requisitos actuales del puesto:\n${currentReqs.trim()}\n\n`;
      }

      const result = await profilesApi.generateWithAI({
        job_title: watchValues.titulo_anuncio || selectedVacancy?.nombre || 'Vendedor',
        company_name: selectedVacancy?.empresa?.nombre || 'Sofi',
        experience_level: 'any',
        job_type: 'tiempo_completo',
        tone: 'profesional',
        additional_context: context || undefined,
      });

      clearAllTypewriters();

      const titleText = result.titulo_anuncio || '';
      const descText = result.descripcion || 'Descripción optimizada por Sofi IA.';
      const reqsText = Array.isArray(result.requisitos) ? result.requisitos.join('\n') : result.requisitos || '';

      if (titleText) {
        let titleIndex = 0;
        let titleCurrent = '';
        const titleInterval = setInterval(() => {
          if (titleIndex < titleText.length) {
            titleCurrent += titleText[titleIndex];
            setValue('titulo_anuncio', titleCurrent, { shouldValidate: true });
            titleIndex++;
          } else {
            clearInterval(titleInterval);
          }
        }, 10);
        typewriterIntervalsRef.current.push(titleInterval);
      }

      let descIndex = 0;
      let descCurrent = '';
      const descInterval = setInterval(() => {
        if (descIndex < descText.length) {
          descCurrent += descText[descIndex];
          setValue('descripcion', descCurrent, { shouldValidate: true });
          descIndex++;
        } else {
          clearInterval(descInterval);
        }
      }, 3);
      typewriterIntervalsRef.current.push(descInterval);

      if (reqsText) {
        let reqsIndex = 0;
        let reqsCurrent = '';
        const reqsInterval = setInterval(() => {
          if (reqsIndex < reqsText.length) {
            reqsCurrent += reqsText[reqsIndex];
            setValue('requisitos', reqsCurrent, { shouldValidate: true });
            reqsIndex++;
          } else {
            clearInterval(reqsInterval);
          }
        }, 5);
        typewriterIntervalsRef.current.push(reqsInterval);
      }

      const suggestions = result.sugerencias || result.suggestions || [
        'Rango salarial visible',
        'Beneficios claros',
        'Horario especifico',
      ];
      setAiSuggestions(suggestions);

      toast.success(t('generateWithAI'));
    } catch (error) {
      toast.error(t('generateWithAI'));
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleContinue = async () => {
    if (!watchValues.titulo_anuncio || !watchValues.descripcion) {
      toast.error(t('adTitleHint'));
      return;
    }

    try {
      const created = await profilesApi.create({
        empresa_id: selectedVacancy?.empresa_id || selectedVacancy?.empresa?.id,
        nombre_perfil: watchValues.titulo_anuncio,
        titulo_anuncio: watchValues.titulo_anuncio,
        categoria_id: selectedVacancy?.categoria_id || selectedVacancy?.categoria?.id,
        descripcion: watchValues.descripcion,
        requisitos: String(watchValues.requisitos || '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        beneficios: [],
        tipo_jornada: 'tiempo_completo',
        moneda: watchValues.moneda_salario,
        ubicacion: watchValues.ubicacion,
      });
      setSelectedProfile(created);
      setStep(3);
    } catch (error) {
      toast.error(t('savedProfiles'));
    }
  };

  const loadProfile = (profile) => {
    setValue('titulo_anuncio', profile.titulo_anuncio);
    setValue('descripcion', profile.descripcion);
    toast.success(t('savedProfiles'));
  };

  return (
    <div className="grid-2">
      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span>✦</span> {t('profileTitle')}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm btn-ai" onClick={handleGenerateAI} disabled={generatingAI}>
                {generatingAI ? t('generating') : `✦ ${t('generateWithAI')}`}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => setPreviewOpen(true)} title={t('previewAd')}>👁 {t('previewAd')}</button>
            </div>
          </div>
          <div className="card-body">
            <div className="rounded-xl border p-4 mb-6 flex gap-3" style={{ background: 'var(--color-purple-light)', borderColor: 'var(--color-border-main)' }}>
              <div className="text-[#7C3AED] text-lg mt-0.5">✦</div>
              <div>
                <strong className="text-sm font-bold text-text-main">{t('aiAssistantTitle')}</strong>
                <p className="text-xs text-text-muted mt-1 mb-3">{t('aiAssistantText')}</p>
                <div className="flex flex-wrap gap-2">
                  <div className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#7C3AED] text-white border border-[#7C3AED]">Retail</div>
                  <div className="px-2.5 py-1 rounded-full text-[11px] font-medium border bg-card text-text-muted border-border-main">Customer service</div>
                  <div className="px-2.5 py-1 rounded-full text-[11px] font-medium border bg-card text-text-muted border-border-main">Full time</div>
                </div>
              </div>
            </div>

            <div className="field-group">
              <div className="field-label">{t('adTitle')}</div>
              <input {...register('titulo_anuncio')} className="field-input" placeholder={t('adTitlePlaceholder')} />
              <div className="field-hint">{t('adTitleHint')}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="field-group">
                <div className="field-label">{t('category')}</div>
                <select {...register('categoria')} className="field-select">
                  <option value="Ventas">{locale === 'en' ? 'Sales' : 'Ventas'}</option>
                  <option value="Atencion al cliente">{locale === 'en' ? 'Customer service' : 'Atencion al cliente'}</option>
                  <option value="Comercio / Retail">{locale === 'en' ? 'Commerce / Retail' : 'Comercio / Retail'}</option>
                </select>
              </div>
              <div className="field-group">
                <div className="field-label">{t('scheduleType')}</div>
                <select {...register('tipo_jornada')} className="field-select">
                  <option value="Tiempo completo">{locale === 'en' ? 'Full time' : 'Tiempo completo'}</option>
                  <option value="Turno rotativo">{locale === 'en' ? 'Rotating shift' : 'Turno rotativo'}</option>
                  <option value="Medio tiempo">{locale === 'en' ? 'Part time' : 'Medio tiempo'}</option>
                </select>
              </div>
              <div className="field-group">
                <div className="field-label">{t('currency')}</div>
                <select {...register('moneda_salario')} className="field-select">
                  {currencyOptions.map((currency) => (
                    <option key={currency.value} value={currency.value}>{currency.value} - {currency.label}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <div className="field-label">{t('salaryRange')}</div>
                <input {...register('salario')} className="field-input" placeholder={t('salaryPlaceholder')} />
              </div>
              <div className="field-group">
                <div className="field-label">{t('location')}</div>
                <input {...register('ubicacion')} className="field-input" placeholder="Ciudad de Mexico, MX" />
              </div>
            </div>

            <div className="field-group">
              <div className="field-label">{t('jobDescription')}</div>
              <div className="textarea-wrap" style={{ position: 'relative', width: '100%' }}>
                <textarea {...register('descripcion')} className="field-textarea" style={{ minHeight: '120px', width: '100%' }}></textarea>
                <div className="ai-badge" style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'var(--color-purple-light)', color: 'var(--color-purple)', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px' }}>IA</div>
              </div>
              <div className="annotation">{t('aiEditableNote')}</div>
            </div>

            <div className="field-group">
              <div className="field-label">{t('requirements')}</div>
              <textarea {...register('requisitos')} className="field-textarea"></textarea>
            </div>

            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← {t('back')}</button>
              <button className="btn btn-outline" onClick={() => setPreviewOpen(true)}>👁 {t('previewAd')}</button>
              <button className="btn btn-primary" onClick={handleContinue}>{t('continueSelectPortals')} →</button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="card summary-card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <div className="card-title"><span>💡</span> {t('aiSuggestions')}</div>
          </div>
          <div className="card-body" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>{t('sofiRecommendsInclude')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(aiSuggestions.length > 0 ? aiSuggestions : ['Rango salarial visible', 'Beneficios claros', 'Horario especifico']).map((sug, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px' }}>
                  <span style={{ color: 'var(--teal)', fontSize: '14px' }}>✓</span>
                  <span>{sug}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><span>📂</span> {t('savedProfiles')}</div>
          </div>
          <div className="card-body" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>{t('reuseProfiles')}</div>
            {loading ? (
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{t('loading')}</div>
            ) : profiles.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{t('noSavedProfiles')}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => loadProfile(p)}
                    style={{ padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: '8px', cursor: 'pointer', transition: 'all .15s' }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--purple)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ fontWeight: 600, fontSize: '12px' }}>{p.titulo_anuncio}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{t('usedInCampaigns')} {p.usage_count || 1} {t('campaigns')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewOpen && createPortal(
        <div className="pp-modal-overlay open">
          <div className="pp-modal" style={{ width: '720px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="pp-modal-header" style={{ background: 'var(--color-bg-main)', flexShrink: 0, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>👁</div>
                <div>
                  <div className="pp-modal-title" style={{ color: 'var(--text)' }}>{t('previewAdTitle')}</div>
                  <div className="pp-modal-sub" style={{ color: 'var(--muted)' }}>{t('previewAdSubtitle')}</div>
                </div>
              </div>
              <button className="pp-modal-close" onClick={() => setPreviewOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', color: 'var(--muted)', cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>x</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '24px', background: 'var(--color-bg-main)' }}>
              <div style={{ background: 'var(--color-card)', borderRadius: '12px', border: '1px solid var(--color-border-main)', overflow: 'hidden', maxWidth: '640px', margin: '0 auto', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                <div style={{ background: 'var(--purple)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#fff' }}>S</div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.5px', fontWeight: 600 }}>{t('companyLabel')}</div>
                    <div style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>SKIC</div>
                  </div>
                </div>
                <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginBottom: '10px' }}>{watchValues.titulo_anuncio || t('adTitle')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{watchValues.ubicacion}</span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{watchValues.tipo_jornada}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--teal-dark)' }}>{formattedSalary}</span>
                  </div>
                </div>
                <div style={{ padding: '22px 24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>{t('jobDescription')}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '18px', whiteSpace: 'pre-wrap' }}>{watchValues.descripcion}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>{t('requirements')}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.9, marginBottom: '18px', whiteSpace: 'pre-wrap' }}>{watchValues.requisitos}</div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
