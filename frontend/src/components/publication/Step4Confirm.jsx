import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { usePublicationStore } from '../../store/publicationStore';
import { campaignsApi } from '../../services/api';

export default function Step4Confirm() {
  const [publishing, setPublishing] = useState(false);
  
  const {
    selectedVacancy,
    selectedProfile,
    selectedPortals,
    campaign,
    setCampaign,
    setStep,
    reset: resetStore,
  } = usePublicationStore();

  const handlePublish = async () => {
    if (!selectedVacancy || !selectedProfile || selectedPortals.length === 0) {
      toast.error('Por favor completa todos los pasos');
      return;
    }

    setPublishing(true);
    try {
      const campaignData = {
        vacante_id: selectedVacancy.id,
        profile_id: selectedProfile.id,
        portales: selectedPortals.map((p) => p.id),
      };

      const created = await campaignsApi.create(campaignData);
      setCampaign(created);
      
      await campaignsApi.publish(created.id);
      setCampaign({ ...created, status: 'publicando' });
      toast.success('Publicación iniciada en los portales');

      pollCampaignStatus(created.id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al publicar');
      setPublishing(false);
    }
  };

  const pollCampaignStatus = (campaignId) => {
    const pollInterval = setInterval(async () => {
      try {
        const updated = await campaignsApi.getById(campaignId);
        setCampaign(updated);

        if (updated.status === 'publicado' || updated.status === 'error') {
          clearInterval(pollInterval);
          setPublishing(false);
          toast.success('Publicación completada en todos los portales');
        }
      } catch (error) {
        clearInterval(pollInterval);
        setPublishing(false);
      }
    }, 1500);

    return pollInterval;
  };

  const totalCost = selectedPortals.reduce((sum, p) => sum + (p.costo_estimado || 0), 0);
  const freeCount = selectedPortals.filter(p => p.modelo === 'gratis' || p.modelo === 'freemium').length;
  const paidCount = selectedPortals.filter(p => p.modelo === 'pago').length;

  const isCompleted = campaign?.status === 'publicado';

  return (
    <div className="grid-2">
      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span>🚀</span> Confirmar y publicar</div>
          </div>
          <div className="card-body">
            <div className="info-box">ℹ️ <span>Revisa el resumen antes de publicar. Una vez confirmado, Sofi enviará la vacante a cada portal seleccionado.</span></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>Vacante</div>
                <div style={{ fontWeight: 700, marginTop: '4px' }}>#{selectedVacancy?.codigo || '---'} · {selectedVacancy?.nombre || 'Sin nombre'}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{selectedVacancy?.empresa?.nombre} · {selectedProfile?.ubicacion || 'Sin ubicación'}</div>
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: '8px', padding: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>Portales</div>
                <div style={{ fontWeight: 700, marginTop: '4px' }}>{selectedPortals.length} portales seleccionados</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{freeCount} gratuitos/freemium · {paidCount} de pago</div>
              </div>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Estado de publicación</div>
            <div className="status-list">
              {selectedPortals.map(portal => {
                let dotClass = 'dot-pending';
                let statusText = 'Pendiente de inicio';
                let tagClass = 'tag-pago';
                let tagText = '⏳ En cola';

                if (publishing || campaign?.status === 'publicando') {
                  dotClass = 'dot-publishing';
                  statusText = 'Publicando...';
                  tagClass = 'tag-freemium';
                  tagText = '⏳ En progreso';
                }

                if (isCompleted || campaign?.portal_status?.[portal.id] === 'publicado') {
                  dotClass = 'dot-success';
                  statusText = 'Publicado correctamente';
                  tagClass = 'tag-gratis';
                  tagText = '✓ Publicado';
                }

                return (
                  <div className="status-item" key={portal.id}>
                    <div className={`status-dot ${dotClass}`}></div>
                    <div style={{ flex: 1 }}>
                      <div className="status-name">{portal.nombre}</div>
                      <div className="status-msg">{statusText}</div>
                    </div>
                    <span className={`tag ${tagClass}`}>{tagText}</span>
                  </div>
                );
              })}
            </div>

            <div className="btn-row" style={{ marginTop: '24px' }}>
              <button className="btn btn-ghost" onClick={() => setStep(3)} disabled={publishing || isCompleted}>← Modificar selección</button>
              {isCompleted ? (
                <button className="btn btn-teal" onClick={() => { resetStore(); setStep(1); }}>✓ Iniciar nueva vacante</button>
              ) : (
                <button className="btn btn-primary" onClick={handlePublish} disabled={publishing}>
                  {publishing ? 'Procesando...' : `🚀 Publicar vacante`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="card summary-card">
          <div className="card-header"><div className="card-title"><span>📊</span> Resumen final</div></div>
          <div className="card-body">
            <div className="cost-row">
              <span className="label">Portales gratuitos a publicar</span>
              <span className="val free">{freeCount} portales</span>
            </div>
            <div className="cost-row">
              <span className="label">Portales de pago a publicar</span>
              <span className="val">{paidCount} portales</span>
            </div>
            
            {selectedPortals.filter(p => p.modelo === 'pago').map(p => (
              <div className="cost-row" key={p.id}>
                <span className="label">{p.nombre}</span>
                <span className="val">MX$ {p.costo_estimado?.toLocaleString('es-MX')}</span>
              </div>
            ))}
            
            <hr className="divider" />
            <div className="cost-total">
              <span>Total a pagar</span>
              <span className="val">MX$ {totalCost.toLocaleString('es-MX')}</span>
            </div>

            <div style={{ marginTop: '18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '8px' }}>Método de pago</div>
              <select className="field-select" style={{ fontSize: '12px' }} disabled={totalCost === 0}>
                {totalCost === 0 ? (
                  <option>No requiere pago</option>
                ) : (
                  <>
                    <option>Tarjeta corporativa ****4821</option>
                    <option>Transferencia bancaria</option>
                    <option>Crédito Sofi (saldo disponible: MX$ 5,000)</option>
                  </>
                )}
              </select>
            </div>

            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '8px' }}>Vigencia de publicaciones</div>
              <input type="date" className="field-input" defaultValue="2026-06-22" style={{ fontSize: '12px' }} />
              <div className="field-hint">Los portales de pago publican hasta esta fecha</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
