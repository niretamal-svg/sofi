import React from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Topbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 w-full max-w-4xl text-center mt-10">
          <div className="w-20 h-20 bg-sofi-purple-light rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🚀</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Bienvenido a Sofi</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            Gestiona tus vacantes, utiliza inteligencia artificial para generar perfiles atractivos 
            y publica automáticamente en múltiples portales con un solo clic.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <div className="text-3xl font-bold text-sofi-purple mb-2">12</div>
              <div className="text-sm font-medium text-gray-600 uppercase">Vacantes Activas</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <div className="text-3xl font-bold text-sofi-teal mb-2">34</div>
              <div className="text-sm font-medium text-gray-600 uppercase">Perfiles IA Creados</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <div className="text-3xl font-bold text-status-active mb-2">8</div>
              <div className="text-sm font-medium text-gray-600 uppercase">Campañas Publicadas</div>
            </div>
          </div>

          <button
            onClick={() => navigate('/publication')}
            className="bg-sofi-purple text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
          >
            ✦ Ir a Publicar Vacante
          </button>
        </div>
      </main>
    </div>
  );
}
