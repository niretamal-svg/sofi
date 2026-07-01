import React from 'react';
import Topbar from '../components/layout/Topbar';
import Step1Vacancy from '../components/publication/Step1Vacancy';
import Step2Profile from '../components/publication/Step2Profile';
import Step3Portals from '../components/publication/Step3Portals';
import Step4Confirm from '../components/publication/Step4Confirm';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { usePublicationStore } from '../store/publicationStore';

export default function PublicationPage() {
  const { currentStep, setStep } = usePublicationStore();
  const { t } = useAppSettings();
  const steps = [t('stepVacancy'), t('stepProfile'), t('stepPortals'), t('stepPublish')];
  const stepDescriptions = [
    t('stepVacancyDescription'),
    t('stepProfileDescription'),
    t('stepPortalsDescription'),
    t('stepPublishDescription'),
  ];
  const currentStepName = steps[currentStep - 1];
  const currentStepDescription = stepDescriptions[currentStep - 1];

  return (
    <div className="min-h-screen app-soft-bg publication-shell">
      <Topbar />

      <div className="breadcrumb">
        <a href="#/dashboard">{t('menuLabel')}</a>
        <span>/</span>
        <a href="#/dashboard">{t('publicationNav')}</a>
        <span>/</span>
        <span>{t('publicationTitle')}</span>
      </div>

      <div className="page publication-page">
        <div className="grid gap-4">
          <section className="card p-5 md:p-6">
            <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < currentStep;
                const isActive = stepNumber === currentStep;

                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setStep(stepNumber)}
                    className={`group flex min-h-[74px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      isCompleted
                        ? 'border-[#00c9a7] bg-[#d1fae5] text-[#075e52] dark:bg-[#0f3f3a] dark:text-[#99f6e4]'
                        : isActive
                          ? 'border-[#6b3fa0] bg-[#ede7f6] text-[#24104f] shadow-[0_10px_26px_rgba(107,63,160,0.12)] dark:border-[#c084fc] dark:bg-[#2a1746] dark:text-white'
                          : 'border-border-main bg-white/65 text-text-muted hover:border-[#6b3fa0]/50 hover:bg-white dark:bg-[#111827] dark:text-slate-300 dark:hover:bg-[#172033]'
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                      isCompleted
                        ? 'bg-[#00c9a7] text-white'
                        : isActive
                          ? 'bg-[#6b3fa0] text-white'
                          : 'bg-[#cbd5e1] text-[#334155] dark:bg-[#334155] dark:text-slate-100'
                    }`}>
                      {isCompleted ? '✓' : stepNumber}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-black uppercase tracking-[0.22em] opacity-75">
                        {t('stepLabel')} {stepNumber}
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-black">{step}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-border-main pt-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-text-muted">
                  {t('publicationTitle')}
                </p>
                <h1 className="m-0 text-2xl font-black text-text-main md:text-3xl">
                  {t('stepLabel')} {currentStep}: {currentStepName}
                </h1>
                <p className="mt-2 text-sm text-text-muted">{currentStepDescription}</p>
              </div>
              <div className="w-fit rounded-2xl border border-border-main bg-white/70 px-4 py-3 text-sm font-bold text-text-main dark:bg-[#111827]">
                {currentStep}/{steps.length}
              </div>
            </div>
          </section>

          <section className="card p-5 md:p-6">
            {currentStep === 1 && <Step1Vacancy />}
            {currentStep === 2 && <Step2Profile />}
            {currentStep === 3 && <Step3Portals />}
            {currentStep === 4 && <Step4Confirm />}
          </section>
        </div>
      </div>
    </div>
  );
}
