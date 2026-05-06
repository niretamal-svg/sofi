import React from 'react';
import { usePublicationStore } from '../store/publicationStore';
import Topbar from '../components/layout/Topbar';
import { useAppSettings } from '../contexts/AppSettingsContext';
import Stepper from '../components/common/Stepper';
import Step1Vacancy from '../components/publication/Step1Vacancy';
import Step2Profile from '../components/publication/Step2Profile';
import Step3Portals from '../components/publication/Step3Portals';
import Step4Confirm from '../components/publication/Step4Confirm';

const steps = ['Vacante', 'Perfil', 'Portales', 'Publicar'];

export default function PublicationPage() {
  const { currentStep, setStep } = usePublicationStore();
  const { t } = useAppSettings();

  return (
    <div className="min-h-screen bg-bg-main publication-shell">
      <Topbar />

      <div className="breadcrumb">
        <a href="#/dashboard">{t('menuLabel')}</a>
        <span>›</span>
        <a href="#/dashboard">{t('publicationNav')}</a>
        <span>›</span>
        <span>{t('publicationTitle')}</span>
      </div>

      <div className="page publication-page">
        <div className="grid gap-0">
          <section className="card p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="section-title">{t('publicationTitle')}</h1>
                <p className="section-subtitle">{t('publicationSubtitle')}</p>
              </div>
            </div>
          </section>

          <section className="card p-8">
            <div className="stepper grid gap-4 md:grid-cols-4">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < currentStep;
                const isActive = stepNumber === currentStep;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setStep(stepNumber)}
                    className={`step ${isCompleted ? 'done' : isActive ? 'active' : ''}`}
                  >
                    <div className="step-num">{isCompleted ? '✓' : stepNumber}</div>
                    <p className="step-label">Paso {stepNumber}</p>
                    <p className="step-name">{step}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card p-8">
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
