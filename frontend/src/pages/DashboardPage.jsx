import React from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import { useAppSettings } from '../contexts/AppSettingsContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useAppSettings();

  return (
    <div className="min-h-screen bg-bg-main">
      <Topbar />
      <main className="page">
        <div className="grid gap-6">
          <section className="card p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-text-muted">{t('dashboardPanel')}</p>
                <h1 className="mt-3 text-4xl font-black text-text-main">{t('dashboardTitle')}</h1>
                <p className="mt-4 max-w-2xl text-sm text-text-muted">
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
            <div className="card p-6">
              <p className="text-3xl font-black text-purple">12</p>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">{t('activeVacancies')}</p>
            </div>
            <div className="card p-6">
              <p className="text-3xl font-black text-teal">34</p>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">{t('profilesCreated')}</p>
            </div>
            <div className="card p-6">
              <p className="text-3xl font-black text-purple-dark">8</p>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">{t('campaignsPublished')}</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
