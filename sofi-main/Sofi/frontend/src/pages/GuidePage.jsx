import React from 'react';
import Topbar from '../components/layout/Topbar';
import { useAppSettings } from '../contexts/AppSettingsContext';

export default function GuidePage() {
  const { t } = useAppSettings();
  const steps = [t('guideStep1'), t('guideStep2'), t('guideStep3'), t('guideStep4')];

  return (
    <div className="min-h-screen app-soft-bg">
      <Topbar />
      <main className="page">
        <section className="card p-5 md:p-6">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-text-muted">
            {t('guideNav')}
          </p>
          <h1 className="m-0 text-2xl font-black text-text-main md:text-3xl">{t('guideTitle')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">{t('guideSubtitle')}</p>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <div className="card p-5" key={step}>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#6b3fa0] text-sm font-black text-white">
                {index + 1}
              </div>
              <p className="text-sm font-bold text-text-main">{step}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
