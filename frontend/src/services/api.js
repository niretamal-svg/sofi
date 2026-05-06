import axios from 'axios';
import toast from 'react-hot-toast';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized caught by interceptor. Falling back to mock data for UI testing.');
      // window.location.href = '/login'; // Disabled to allow UI testing
    } else if (error.response?.status === 403) {
      console.warn('403 Forbidden caught by interceptor. Falling back to mock data if configured.');
    }
    return Promise.reject(error);
  }
);

// Mock Data Storage for Demo Fallback
let mockVacancies = [
  { id: 'vac-1', codigo: 'VAC-001', nombre: 'Desarrollador Full Stack', empresa: { nombre: 'Tech Solutions' }, categoria: { nombre: 'Tecnología' }, estado: 'activa' },
  { id: 'vac-2', codigo: 'VAC-002', nombre: 'Gerente de Ventas', empresa: { nombre: 'Acme Corp' }, categoria: { nombre: 'Ventas' }, estado: 'borrador' }
];
let mockProfiles = [];
let mockCampaigns = [];

const mockCompanies = [
  { id: 'comp-1', nombre: 'Acme Corp', pais: 'México' },
  { id: 'comp-2', nombre: 'Tech Solutions', pais: 'Global' }
];

const mockCategories = [
  { id: 'cat-1', nombre: 'Tecnología' },
  { id: 'cat-2', nombre: 'Ventas' },
  { id: 'cat-3', nombre: 'Marketing' }
];

const mockPortals = [
  {
    id: 'portal-1', nombre: 'LinkedIn', modelo: 'freemium', costo_base: 0, 
    paises: ['GLOBAL'], logo_url: 'https://cdn-icons-png.flaticon.com/512/174/174857.png'
  },
  {
    id: 'portal-2', nombre: 'Computrabajo MX', modelo: 'pago', costo_base: 450, 
    paises: ['MX'], logo_url: 'https://styles.redditmedia.com/t5_2w2552/styles/communityIcon_vmyz61s4ngs61.png',
    costo_estimado: 450
  },
  {
    id: 'portal-3', nombre: 'Indeed', modelo: 'gratis', costo_base: 0, 
    paises: ['GLOBAL'], logo_url: 'https://cdn.iconscout.com/icon/free/png-256/indeed-2752158-2284975.png'
  },
  {
    id: 'portal-4', nombre: 'OCCMundial', modelo: 'pago', costo_base: 800, 
    paises: ['MX'], costo_estimado: 800
  },
  {
    id: 'portal-5', nombre: 'Portal del Empleo SNE', modelo: 'gratis', costo_base: 0, 
    paises: ['MX']
  },
  {
    id: 'portal-6', nombre: 'Computrabajo GT', modelo: 'pago', costo_base: 300, 
    paises: ['GT'], costo_estimado: 300
  },
  {
    id: 'portal-7', nombre: 'Tecoloco', modelo: 'freemium', costo_base: 0, 
    paises: ['GT', 'HN', 'SV', 'NI']
  },
  {
    id: 'portal-8', nombre: 'Encuentra24', modelo: 'freemium', costo_base: 0, 
    paises: ['GT', 'HN', 'NI']
  },
  {
    id: 'portal-9', nombre: 'ZipRecruiter', modelo: 'pago', costo_base: 1200, 
    paises: ['US'], costo_estimado: 1200
  },
  {
    id: 'portal-10', nombre: 'Glassdoor', modelo: 'gratis', costo_base: 0, 
    paises: ['GLOBAL']
  }
];

export const vacanciesApi = {
  getAll: (filters = {}) =>
    api.get('/vacancies', { params: filters }).then((res) => res.data).catch(() => mockVacancies),
  create: (data) =>
    api.post('/vacancies', data).then((res) => res.data).catch(() => {
      const company = mockCompanies.find(c => c.id === data.empresa_id) || { nombre: 'Demo Empresa' };
      const category = mockCategories.find(c => c.id === data.categoria_id) || { nombre: 'Demo Categoría' };
      const newVac = { 
        id: 'vac-' + Date.now(), 
        codigo: 'VAC-' + Math.floor(Math.random() * 1000),
        ...data,
        empresa: company,
        categoria: category
      };
      mockVacancies.push(newVac);
      return newVac;
    }),
  getById: (id) =>
    api.get(`/vacancies/${id}`).then((res) => res.data).catch(() => mockVacancies.find(v => v.id === id)),
  update: (id, data) =>
    api.put(`/vacancies/${id}`, data).then((res) => res.data),
};

export const profilesApi = {
  getAll: (filters = {}) =>
    api.get('/profiles', { params: filters }).then((res) => res.data).catch(() => mockProfiles),
  create: (data) =>
    api.post('/profiles', data).then((res) => res.data).catch(() => {
      const newProf = { id: 'prof-' + Date.now(), ...data };
      mockProfiles.push(newProf);
      return newProf;
    }),
  generateWithAI: (data) =>
    api.post('/profiles/ai/generate', data).then((res) => res.data).catch(async () => {
      // Simulate AI delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        titulo_anuncio: `${data.job_title} (Generado por IA)`,
        descripcion: `Buscamos un excelente profesional para el puesto de ${data.job_title} en nuestra empresa. ¡Únete a nuestro equipo dinámico y crece con nosotros! \n\nEsta descripción fue generada automáticamente para la demo por Sofi AI.`,
        requisitos: ['Experiencia previa en roles similares', 'Proactividad y trabajo en equipo', 'Orientación a resultados'],
        beneficios: ['Sueldo competitivo', 'Excelente ambiente laboral', 'Oportunidades de crecimiento'],
        tipo_jornada: data.job_type || 'tiempo_completo',
        ia_chips: ['innovación', 'liderazgo'],
        suggestions: ['Añade el rango salarial para atraer más candidatos', 'Destaca los beneficios de salud']
      };
    }),
};

export const portalsApi = {
  getAll: (filters = {}) =>
    api.get('/portals', { params: filters }).then((res) => res.data).catch(() => mockPortals),
  saveCredentials: (portalId, credentials) =>
    api.put(`/portals/${portalId}/credentials`, credentials).then((res) => res.data).catch(() => ({ success: true })),
};

export const campaignsApi = {
  create: (data) =>
    api.post('/campaigns', data).then((res) => res.data).catch(() => {
      const newCamp = { id: 'camp-' + Date.now(), estado: 'borrador', ...data };
      mockCampaigns.push(newCamp);
      return newCamp;
    }),
  getById: (id) =>
    api.get(`/campaigns/${id}`).then((res) => res.data).catch(() => mockCampaigns.find(c => c.id === id)),
  publish: (id) =>
    api.post(`/campaigns/${id}/publish`).then((res) => res.data).catch(async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const camp = mockCampaigns.find(c => c.id === id);
      if(camp) camp.estado = 'publicando';
      return camp;
    }),
  cancel: (id) =>
    api.post(`/campaigns/${id}/cancel`).then((res) => res.data),
};

export const paymentsApi = {
  create: (data) =>
    api.post('/payments', data).then((res) => res.data),
  getById: (id) =>
    api.get(`/payments/${id}`).then((res) => res.data),
};

export const companiesApi = {
  getAll: () =>
    api.get('/companies').then((res) => res.data).catch(() => mockCompanies),
};

export const categoriesApi = {
  getAll: () =>
    api.get('/categories').then((res) => res.data).catch(() => mockCategories),
};

export default api;
