import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { campaignsApi, profilesApi, vacanciesApi } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useAppSettings();
  const [metrics, setMetrics] = useState({
    activeVacancies: 0,
    profiles: 0,
    campaigns: 0,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const [vacancies, profiles, campaigns] = await Promise.all([
          vacanciesApi.getAll({ per_page: 100 }),
          profilesApi.getAll({ per_page: 100 }),
          campaignsApi.getAll ? campaignsApi.getAll({ per_page: 100 }) : Promise.resolve([]),
        ]);

        setMetrics({
          activeVacancies: (vacancies || []).filter((vacancy) => {
            const status = String(vacancy.estado || '').toLowerCase();
            return status === 'vigente' || status === 'activa' || status === 'activo' || status === 'active';
          }).length,
          profiles: (profiles || []).length,
          campaigns: (campaigns || []).filter((campaign) => {
            const status = String(campaign.estado || campaign.status || '').toLowerCase();
            return status === 'publicada' || status === 'publicando';
          }).length,
        });
      } catch (error) {
        console.error('Error loading dashboard metrics:', error);
      }
    };

    loadMetrics();
  }, []);

  return (
    <div className="min-h-screen app-soft-bg">
      <Topbar />
      <main className="page">
        <div className="grid gap-4">
          <section className="card p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-text-muted">{t('dashboardPanel')}</p>
                <h1 className="m-0 text-2xl font-black text-text-main md:text-3xl">{t('dashboardTitle')}</h1>
                <p className="mt-2 max-w-2xl text-sm text-text-muted">
                  {t('dashboardSubtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/publication')}
                className="btn-primary"
              >
                {t('publishVacancy')}
              </button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="card p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-3xl font-black text-purple">{metrics.activeVacancies}</p>
                <span className="rounded-2xl border border-border-main bg-white/70 px-3 py-2 text-xs font-black text-text-muted">01</span>
              </div>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-text-muted">{t('activeVacancies')}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-3xl font-black text-teal">{metrics.profiles}</p>
                <span className="rounded-2xl border border-border-main bg-white/70 px-3 py-2 text-xs font-black text-text-muted">02</span>
              </div>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-text-muted">{t('profilesCreated')}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-3xl font-black text-purple-dark">{metrics.campaigns}</p>
                <span className="rounded-2xl border border-border-main bg-white/70 px-3 py-2 text-xs font-black text-text-muted">03</span>
              </div>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-text-muted">{t('campaignsPublished')}</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
