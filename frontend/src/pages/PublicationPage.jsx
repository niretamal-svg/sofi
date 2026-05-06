import React from 'react';
import { usePublicationStore } from '../store/publicationStore';
import Topbar from '../components/layout/Topbar';
import Stepper from '../components/common/Stepper';
import Step1Vacancy from '../components/publication/Step1Vacancy';
import Step2Profile from '../components/publication/Step2Profile';
import Step3Portals from '../components/publication/Step3Portals';
import Step4Confirm from '../components/publication/Step4Confirm';

const steps = ['Vacante', 'Perfil', 'Portales', 'Publicar'];

export default function PublicationPage() {
  const { currentStep, setStep } = usePublicationStore();

  return (
    <div className="bg-bg min-h-screen">
      <Topbar />

      <div className="breadcrumb">
        <a href="#/dashboard">Menú administrador</a>
        <span>›</span>
        <a href="#/dashboard">Gestión de vacantes</a>
        <span>›</span>
        <span>Publicación en portales</span>
      </div>

      <div className="page">
        <div className="section-title">Publicación en portales de empleo</div>
        <div className="section-subtitle">Define el perfil, selecciona los portales y publica tu vacante en México y Centroamérica</div>

        <div className="stepper">
          <div className={`step ${currentStep > 1 ? 'done' : currentStep === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>
            <div className="step-num">{currentStep > 1 ? '✓' : '1'}</div>
            <div className="step-info">
              <div className="step-label">Paso 1</div>
              <div className="step-name">Seleccionar vacante</div>
            </div>
          </div>
          <div className={`step ${currentStep > 2 ? 'done' : currentStep === 2 ? 'active' : ''}`} onClick={() => setStep(2)}>
            <div className="step-num">{currentStep > 2 ? '✓' : '2'}</div>
            <div className="step-info">
              <div className="step-label">Paso 2</div>
              <div className="step-name">Perfil & descripción</div>
            </div>
          </div>
          <div className={`step ${currentStep > 3 ? 'done' : currentStep === 3 ? 'active' : ''}`} onClick={() => setStep(3)}>
            <div className="step-num">{currentStep > 3 ? '✓' : '3'}</div>
            <div className="step-info">
              <div className="step-label">Paso 3</div>
              <div className="step-name">Seleccionar portales</div>
            </div>
          </div>
          <div className={`step ${currentStep === 4 ? 'active' : ''}`} onClick={() => setStep(4)}>
            <div className="step-num">4</div>
            <div className="step-info">
              <div className="step-label">Paso 4</div>
              <div className="step-name">Confirmar & publicar</div>
            </div>
          </div>
        </div>

        <div>
          {currentStep === 1 && <Step1Vacancy />}
          {currentStep === 2 && <Step2Profile />}
          {currentStep === 3 && <Step3Portals />}
          {currentStep === 4 && <Step4Confirm />}
        </div>
      </div>
    </div>
  );
}
