import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { campaignsApi, paymentsApi } from '../../services/api';
import { usePublicationStore } from '../../store/publicationStore';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51Pt3Lp0012345678');
const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== 'false';

function StripePaymentForm({ amount, currency, currencySymbol, currencyCode, onSuccess, onCancel, executePublish }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [cardName, setCardName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cardName.trim()) {
      setError('Por favor ingresa el nombre del titular.');
      return;
    }
    
    setProcessing(true);
    setError(null);

    try {
      // 1. Create campaign first to get its ID, or create a mock/temp payment
      const campaignId = await executePublish(true); // pass true to only create campaign and return ID
      if (!campaignId) {
        setError('Error al registrar la campaña en el servidor.');
        setProcessing(false);
        return;
      }

      // 2. Create payment in backend to get client_secret
      const paymentRes = await paymentsApi.create({
        campana_id: campaignId,
        empresa_id: 'comp-1',
        monto: amount,
        moneda: currency,
      });

      const clientSecret = paymentRes.client_secret;

      // 3. Check for mock/fallback client secret
      if (clientSecret.startsWith('mock_')) {
        setTimeout(() => {
          onSuccess(campaignId, paymentRes.id);
        }, 1500);
        return;
      }

      if (!stripe || !elements) {
        setError('El procesador de pagos de Stripe no se ha cargado.');
        setProcessing(false);
        return;
      }

      // 4. Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: cardName,
          },
        },
      });

      if (result.error) {
        setError(result.error.message);
        setProcessing(false);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          onSuccess(campaignId, paymentRes.id);
        } else {
          setError('El pago no pudo ser completado.');
          setProcessing(false);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Error al procesar el pago seguro.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-4">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Total a Pagar</span>
        <span className="text-2xl font-black text-slate-800">
          {currencySymbol} {amount.toLocaleString('es-MX')} {currencyCode}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nombre del Titular</label>
        <input 
          type="text" 
          required
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          placeholder="Ej. Ana Márquez" 
          className="w-full h-12 px-4 rounded-xl border border-slate-200 font-semibold focus:border-[#635bff] outline-none transition"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Datos de la Tarjeta</label>
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1e293b',
                '::placeholder': {
                  color: '#94a3b8',
                },
              },
            },
          }} />
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          type="button" 
          onClick={onCancel}
          disabled={processing}
          className="flex-1 h-12 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition"
        >
          Cancelar
        </button>
        <button 
          type="submit"
          disabled={processing}
          className="flex-1 h-12 bg-[#635bff] hover:bg-[#5249e0] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(99,91,255,0.3)] transition disabled:opacity-50"
        >
          {processing ? 'Procesando...' : `Pagar`}
        </button>
      </div>
      <p className="text-[10px] text-center text-slate-400 font-semibold uppercase tracking-wider">
        Conexión cifrada SSL de 256 bits
      </p>
    </form>
  );
}

export default function Step4Confirm() {
  const { t } = useAppSettings();
  const [publishing, setPublishing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('stripe');
  const [paymentModal, setPaymentModal] = useState(null); // 'stripe', 'transbank', or null
  const [paymentStep, setPaymentStep] = useState('input'); // 'input', 'processing', 'success', 'bank-auth'

  // Card state for Stripe (unused but kept for state shape backward compatibility)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  // Chilean state for Transbank
  const [rut, setRut] = useState('');
  const [selectedBank, setSelectedBank] = useState('chile');

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

  useEffect(() => {
    // Check if we returned from Transbank Webpay Plus
    const params = new URLSearchParams(window.location.hash.split('?')[1] || window.location.search);
    const paymentStatus = params.get('payment_status');
    const campaignId = params.get('campaign_id');

    if (paymentStatus === 'success' && campaignId) {
      toast.success('¡Transacción de Webpay aprobada con éxito!');
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash.split('?')[0]);
      
      setStep(4);
      setPublishing(true);
      
      // Trigger publish first, then poll status
      const publishAndPoll = async () => {
        try {
          const updatedCampaign = await campaignsApi.publish(campaignId);
          setCampaign(updatedCampaign);
          pollCampaignStatus(campaignId);
        } catch (err) {
          console.error('Error triggering publication after Webpay:', err);
          pollCampaignStatus(campaignId);
        }
      };
      publishAndPoll();
    } else if (paymentStatus === 'failure') {
      toast.error('La transacción de Webpay fue rechazada o cancelada.');
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash.split('?')[0]);
    }
  }, []);

  async function handlePublish() {
    if (!selectedVacancy || !selectedProfile || selectedPortals.length === 0) {
      toast.error(t('confirmPublishInfo'));
      return;
    }

    if (totalCost > 0) {
      if (selectedMethod === 'stripe') {
        setPaymentModal('stripe');
        setPaymentStep('input');
        return;
      }
      if (selectedMethod === 'transbank') {
        await handleTransbankSubmit();
        return;
      }
    }

    await executePublish();
  };

  async function executePublish(onlyCreate = false, paymentId = null) {
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

      if (paymentId) {
        campaignData.pago_id = paymentId;
      }

      const created = await campaignsApi.create(campaignData);
      setCampaign(created);

      if (onlyCreate) {
        setPublishing(false);
        return created.id;
      }

      await campaignsApi.publish(created.id);
      setCampaign({ ...created, estado: 'publicando', status: 'publicando' });
      toast.success(t('publishing'));

      pollCampaignStatus(created.id);
    } catch (error) {
      toast.error(error.response?.data?.message || t('publishVacancyAction'));
      setPublishing(false);
    }
  };

  async function handleStripeSuccess(campaignId, paymentId) {
    setPaymentStep('processing');
    try {
      await campaignsApi.publish(campaignId);
      setCampaign((current) => ({ ...current, estado: 'publicando', status: 'publicando', pago_id: paymentId }));
      setPaymentStep('success');
      setTimeout(() => {
        setPaymentModal(null);
        setPublishing(true);
        pollCampaignStatus(campaignId);
      }, 1500);
    } catch (error) {
      toast.error('Error al publicar tras el pago.');
      setPaymentModal(null);
      setPublishing(false);
    }
  };

  async function handleTransbankSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    
    setPublishing(true);
    setPaymentModal('transbank');
    setPaymentStep('processing');
    try {
      // 1. Create campaign first to get its ID
      const campaignId = await executePublish(true);
      if (!campaignId) {
        toast.error('Error al registrar la campaña.');
        setPaymentModal(null);
        setPublishing(false);
        return;
      }

      // 2. Initiate Transbank Webpay transaction
      const returnUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1') + '/payments/transbank/return';
      const res = await paymentsApi.initiateTransbank({
        campana_id: campaignId,
        empresa_id: selectedVacancy.empresa_id || selectedVacancy.empresa?.id || 'comp-1',
        monto: totalCost,
        moneda: currencyCode,
        return_url: returnUrl
      });

      if (res.token.startsWith('mock_')) {
        // Fallback mock flow
        setPaymentStep('bank-auth');
      } else {
        // Real Webpay Plus redirection
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = res.url;
        
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'token_ws';
        input.value = res.token;
        
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al iniciar Webpay.');
      setPaymentModal(null);
      setPublishing(false);
    }
  };

  async function handleBankAuthSubmit() {
    setPaymentStep('processing');
    
    // Simulate confirming transaction with backend mock API
    setTimeout(async () => {
      try {
        const campaignId = campaign?.id;
        const commitRes = await paymentsApi.commitTransbank({ token: 'mock_token_' });
        
        if (commitRes.status === 'approved') {
          await campaignsApi.publish(campaignId);
          setCampaign((current) => ({ ...current, estado: 'publicando', status: 'publicando' }));
          
          setPaymentStep('success');
          setTimeout(() => {
            setPaymentModal(null);
            setPublishing(true);
            pollCampaignStatus(campaignId);
          }, 1500);
        } else {
          toast.error('La transacción fue rechazada por el banco emisor.');
          setPaymentStep('input');
        }
      } catch (err) {
        toast.error('Error al autorizar la transacción.');
        setPaymentStep('input');
      }
    }, 2000);
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
  const currencyCode = selectedProfile?.moneda || 'MXN';
  const currencySymbol = currencyCode === 'USD' ? 'US$' : currencyCode === 'CLP' ? 'CLP$' : 'MX$';
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
              <div style={{ fontSize: '11px', color: 'var(--muted)', font_weight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '8px' }}>{t('paymentMethod')}</div>
              <select 
                className="field-select" 
                style={{ fontSize: '12px' }} 
                disabled={totalCost === 0}
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
              >
                {totalCost === 0 ? (
                  <option value="none">{t('noPaymentRequired')}</option>
                ) : (
                  <>
                    <option value="stripe">Stripe (Tarjeta de crédito / débito)</option>
                    <option value="transbank">Transbank Webpay</option>
                    <option value="transferencia">{t('bankTransfer')}</option>
                    <option value="credito">{t('sofiCredit')}</option>
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
      {/* Stripe Payment Modal */}
      {paymentModal === 'stripe' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 text-left">
            <div className="p-6 bg-[#635bff] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Pago Seguro con Stripe</h3>
                  <p className="text-xs text-white/80">Pasarela de pago internacional</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setPaymentModal(null)} 
                className="text-white/80 hover:text-white text-2xl font-bold transition"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {paymentStep === 'input' && (
                <Elements stripe={stripePromise}>
                  <StripePaymentForm 
                    amount={totalCost}
                    currency={currencyCode}
                    currencySymbol={currencySymbol}
                    currencyCode={currencyCode}
                    onSuccess={handleStripeSuccess}
                    onCancel={() => setPaymentModal(null)}
                    executePublish={executePublish}
                  />
                </Elements>
              )}

              {paymentStep === 'processing' && (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-[#635bff] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <h4 className="text-base font-bold text-slate-700">Procesando pago seguro...</h4>
                  <p className="text-xs text-slate-400">Por favor no cierres la ventana.</p>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="py-8 text-center space-y-4 animate-bounce">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
                    ✓
                  </div>
                  <h4 className="text-lg font-black text-slate-800">¡Pago Exitoso!</h4>
                  <p className="text-xs text-slate-500">Tu vacante se está publicando en este momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transbank Webpay Modal */}
      {paymentModal === 'transbank' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-[#f4f4f7] rounded-3xl max-w-md w-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 text-left">
            <div className="p-5 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-red-600 text-white font-black rounded-lg text-xs tracking-wider">Webpay Plus</span>
                <div>
                  <h3 className="text-sm font-black text-slate-700">Portal de Pago Transbank</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Chilean payment gateway</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setPaymentModal(null)} 
                className="text-slate-400 hover:text-slate-700 text-2xl font-bold transition"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {paymentStep === 'input' && (
                <form onSubmit={handleTransbankSubmit} className="space-y-4">
                  <div className="text-center bg-white border border-slate-200 p-4 rounded-2xl mb-4 shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Monto del Comercio</span>
                    <span className="text-2xl font-black text-red-600">
                      {currencySymbol} {totalCost.toLocaleString('es-MX')} {currencyCode}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">RUT del Tarjetahabiente</label>
                    <input 
                      type="text" 
                      required
                      value={rut}
                      onChange={(e) => setRut(e.target.value)}
                      placeholder="12.345.678-9" 
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-semibold focus:border-red-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Banco Emisor</label>
                    <select 
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-semibold focus:border-red-500 outline-none transition"
                    >
                      <option value="chile">Banco de Chile</option>
                      <option value="santander">Santander</option>
                      <option value="estado">Banco Estado</option>
                      <option value="bci">BCI</option>
                      <option value="itau">Itaú</option>
                      <option value="scotiabank">Scotiabank</option>
                    </select>
                  </div>

                  <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Método de pago:</span>
                    <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-black rounded-lg border border-red-100">
                      Débito / Crédito
                    </span>
                  </div>

                  <button 
                    type="submit"
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(220,38,38,0.25)] transition"
                  >
                    Pagar con Webpay
                  </button>
                </form>
              )}

              {paymentStep === 'bank-auth' && (
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
                    <div className="h-8 w-auto flex items-center justify-center gap-2 text-slate-600 font-black mb-3">
                      🏦 {(selectedBank || 'Banco').toUpperCase()}
                    </div>
                    <p className="text-xs font-bold text-slate-500 mb-1">Autorización de Transacción Bancaria</p>
                    <p className="text-lg font-black text-slate-700 mb-4">
                      {currencySymbol} {totalCost.toLocaleString('es-MX')}
                    </p>
                    
                    <div className="bg-amber-50 border border-amber-100 text-amber-800 text-[11px] font-semibold p-3 rounded-xl mb-4">
                      Simulación: Autoriza la transacción ingresando tu clave de transferencias bancaria.
                    </div>

                    <div className="flex justify-center gap-2 mb-4">
                      <input type="password" placeholder="••••" maxLength="4" className="w-24 h-12 text-center text-lg tracking-widest border border-slate-200 rounded-xl focus:border-red-500 outline-none" />
                    </div>

                    <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setPaymentStep('input')} 
                        className="flex-1 h-12 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition"
                      >
                        Atrás
                      </button>
                      <button 
                        type="button" 
                        onClick={handleBankAuthSubmit} 
                        className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition"
                      >
                        Autorizar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <h4 className="text-base font-bold text-slate-700">Autorizando transacción con Transbank...</h4>
                  <p className="text-xs text-slate-400">Por favor no cierres la página.</p>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="py-8 text-center space-y-4 animate-bounce">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
                    ✓
                  </div>
                  <h4 className="text-lg font-black text-slate-800">¡Transacción Exitosa!</h4>
                  <p className="text-xs text-slate-500">Retornando al sitio del comercio...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
