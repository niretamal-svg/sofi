import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { campaignsApi } from '../../services/api';
import { usePublicationStore } from '../../store/publicationStore';

export default function Step4Confirm() {
  const { t } = useAppSettings();
  const [publishing, setPublishing] = useState(false);

  const {
    selectedVacancy,
    selectedProfile,
    selectedCountries,
    selectedPortals,
    campaign,
    setCampaign,
    setStep,
    reset: resetStore,
  } = usePublicationStore();

  const handlePublish = async () => {
    if (!selectedVacancy || !selectedProfile || selectedPortals.length === 0) {
      toast.error(t('confirmPublishInfo'));
      return;
    }

    setPublishing(true);
    try {
      const campaignData = {
        vacante_id: selectedVacancy.id,
        perfil_id: selectedProfile.id,
        empresa_id: selectedVacancy.empresa_id || selectedVacancy.empresa?.id || 'comp-1',
        portales: selectedPortals.map((p) => p.id),
        paises_activos: selectedCountries,
        selected_portals: selectedPortals,
      };

      const created = await campaignsApi.create(campaignData);
      setCampaign(created);

      await campaignsApi.publish(created.id);
      setCampaign({ ...created, estado: 'publicando', status: 'publicando' });
      toast.success(t('publishing'));

      pollCampaignStatus(created.id);
    } catch (error) {
      toast.error(error.response?.data?.message || t('publishVacancyAction'));
      setPublishing(false);
    }
  };

  const pollCampaignStatus = (campaignId) => {
    const pollInterval = setInterval(async () => {
      try {
        const updated = await campaignsApi.getById(campaignId);
        setCampaign(updated);

        if (updated.estado === 'publicada' || updated.status === 'publicada' || updated.estado === 'error' || updated.status === 'error') {
          clearInterval(pollInterval);
          setPublishing(false);
          if (updated.estado === 'publicada' || updated.status === 'publicada') {
            toast.success(t('publishedOk'));
          }
        }
      } catch (error) {
        clearInterval(pollInterval);
        setPublishing(false);
      }
    }, 1500);

    return pollInterval;
  };

  const totalCost = selectedPortals.reduce((sum, p) => sum + (p.costo_estimado || 0), 0);
  const freeCount = selectedPortals.filter((p) => p.modelo === 'gratis' || p.modelo === 'freemium').length;
  const paidCount = selectedPortals.filter((p) => p.modelo === 'pago').length;
  const isCompleted = campaign?.estado === 'publicada' || campaign?.status === 'publicada';
  const campaignPortalStatuses = Object.fromEntries(
    (campaign?.portales || []).map((portal) => [portal.portal_id, portal])
  );

  return (
    <div className="grid-2">
      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span>🚀</span> {t('confirmPublishTitle')}</div>
          </div>
          <div className="card-body">
            <div className="info-box">ℹ <span>{t('confirmPublishInfo')}</span></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div style={{ background: 'var(--color-bg-main)', borderRadius: '8px', padding: '12px', border: '1px solid var(--color-border-main)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>{t('vacancy')}</div>
                <div style={{ fontWeight: 700, marginTop: '4px' }}>#{selectedVacancy?.codigo || '---'} - {selectedVacancy?.nombre || t('noName')}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{selectedVacancy?.empresa?.nombre} - {selectedProfile?.ubicacion || t('noLocation')}</div>
              </div>
              <div style={{ background: 'var(--color-bg-main)', borderRadius: '8px', padding: '12px', border: '1px solid var(--color-border-main)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>{t('portals')}</div>
                <div style={{ fontWeight: 700, marginTop: '4px' }}>{selectedPortals.length} {t('selectedPortalsCount')}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{freeCount} {t('freeFreemiumPortals')} - {paidCount} {t('paid')}</div>
              </div>
            </div>

            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>{t('publicationStatus')}</div>
            <div className="status-list">
              {selectedPortals.map((portal) => {
                let dotClass = 'dot-pending';
                let statusText = t('pendingStart');
                let tagClass = 'tag-pago';
                let tagText = t('queued');

                const portalStatus = campaignPortalStatuses[portal.id];
                const portalEstado = portalStatus?.estado || campaign?.portal_status?.[portal.id];

                if (publishing || campaign?.estado === 'publicando' || campaign?.status === 'publicando' || portalEstado === 'publicando') {
                  dotClass = 'dot-publishing';
                  statusText = t('publishing');
                  tagClass = 'tag-freemium';
                  tagText = t('inProgress');
                }

                if (isCompleted || portalEstado === 'publicada' || portalEstado === 'publicado') {
                  dotClass = 'dot-success';
                  statusText = t('publishedOk');
                  tagClass = 'tag-gratis';
                  tagText = t('published');
                }

                if (portalEstado === 'error') {
                  dotClass = 'dot-error';
                  statusText = portalStatus?.error_msg || 'Error';
                  tagClass = 'tag-pago';
                  tagText = 'Error';
                }

                return (
                  <div className="status-item" key={portal.id}>
                    <div className={`status-dot ${dotClass}`}></div>
                    <div style={{ flex: 1 }}>
                      <div className="status-name">{portal.nombre}</div>
                      <div className="status-msg">{statusText}</div>
                      {portalStatus?.url_publicacion && (
                        <a className="text-xs font-bold text-purple hover:underline" href={portalStatus.url_publicacion} target="_blank" rel="noreferrer">
                          {portalStatus.url_publicacion}
                        </a>
                      )}
                    </div>
                    <span className={`tag ${tagClass}`}>{tagText}</span>
                  </div>
                );
              })}
            </div>

            <div className="btn-row" style={{ marginTop: '24px' }}>
              <button className="btn btn-ghost" onClick={() => setStep(3)} disabled={publishing || isCompleted}>← {t('modifySelection')}</button>
              {isCompleted ? (
                <button className="btn btn-teal" onClick={() => { resetStore(); setStep(1); }}>✓ {t('startNewVacancy')}</button>
              ) : (
                <button className="btn btn-primary" onClick={handlePublish} disabled={publishing}>
                  {publishing ? t('processing') : `🚀 ${t('publishVacancyAction')}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="card summary-card">
          <div className="card-header"><div className="card-title"><span>📊</span> {t('finalSummary')}</div></div>
          <div className="card-body">
            <div className="cost-row">
              <span className="label">{t('freePortalsToPublish')}</span>
              <span className="val free">{freeCount} {t('portals')}</span>
            </div>
            <div className="cost-row">
              <span className="label">{t('paidPortalsToPublish')}</span>
              <span className="val">{paidCount} {t('portals')}</span>
            </div>

            {selectedPortals.filter((p) => p.modelo === 'pago').map((p) => (
              <div className="cost-row" key={p.id}>
                <span className="label">{p.nombre}</span>
                <span className="val">MX$ {p.costo_estimado?.toLocaleString('es-MX')}</span>
              </div>
            ))}

            <hr className="divider" />
            <div className="cost-total">
              <span>{t('totalToPay')}</span>
              <span className="val">MX$ {totalCost.toLocaleString('es-MX')}</span>
            </div>

            <div style={{ marginTop: '18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '8px' }}>{t('paymentMethod')}</div>
              <select className="field-select" style={{ fontSize: '12px' }} disabled={totalCost === 0}>
                {totalCost === 0 ? (
                  <option>{t('noPaymentRequired')}</option>
                ) : (
                  <>
                    <option>{t('corporateCard')}</option>
                    <option>{t('bankTransfer')}</option>
                    <option>{t('sofiCredit')}</option>
                  </>
                )}
              </select>
            </div>

            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '8px' }}>{t('publicationValidity')}</div>
              <input type="date" className="field-input" defaultValue="2026-06-22" style={{ fontSize: '12px' }} />
              <div className="field-hint">{t('paidPortalsPublishUntil')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
