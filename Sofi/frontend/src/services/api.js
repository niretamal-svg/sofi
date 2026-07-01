import axios from 'axios';
import toast from 'react-hot-toast';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== 'false';

const unwrapList = (response) => response.data?.data ?? response.data;
const withMockFallback = async (request, fallback) => {
  try {
    return await request();
  } catch (error) {
    if (mocksEnabled) {
      return typeof fallback === 'function' ? fallback(error) : fallback;
    }
    throw error;
  }
};

const normalizePortal = (portal) => ({
  ...portal,
  modelo: portal.modelo ?? portal.modelo_empresa,
  costo_estimado: portal.costo_estimado ?? portal.costo_base ?? 0,
});
const normalizeCampaign = (campaign) => ({
  ...campaign,
  status: campaign.status ?? campaign.estado,
  portal_status: campaign.portal_status ?? Object.fromEntries(
    (campaign.portales || []).map((portal) => [portal.portal_id, portal.estado])
  ),
});
const isMongoObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

const makeProfessionalRequirements = (lines, jobTitle) => {
  const dictionary = {
    react: 'Dominio avanzado del ecosistema de React.js, hooks personalizados y arquitectura de componentes modernos.',
    python: 'Experiencia en desarrollo backend robusto utilizando Python y frameworks como FastAPI, Django o Flask.',
    javascript: 'Conocimientos profundos de JavaScript moderno (ES6+) y desarrollo con TypeScript.',
    sql: 'Sólidos conocimientos en diseño, modelado y optimización de bases de datos relacionales (SQL).',
    nosql: 'Experiencia práctica trabajando con bases de datos NoSQL, preferentemente MongoDB.',
    git: 'Manejo fluido de sistemas de control de versiones Git y flujos de trabajo colaborativos (GitFlow).',
    ingles: 'Comprensión lectora y comunicación oral técnica fluida en idioma inglés.',
    comunicacion: 'Habilidades excepcionales de comunicación asertiva, trabajo colaborativo e inteligencia emocional.',
    proactividad: 'Actitud proactiva orientada a la mejora continua de procesos y resolución ágil de problemas.',
    servicio: 'Marcada orientación de servicio al cliente y excelencia en la calidad de entrega.'
  };

  const formatted = [];
  if (!lines || lines.length === 0) {
    return [
      `Experiencia profesional comprobable mínima de 2 años desempeñando funciones de ${jobTitle} o similares.`,
      'Formación académica en Ingeniería de Software, Ciencias de la Computación o experiencia equivalente comprobable.',
      'Capacidad demostrada para el aseguramiento de mejores prácticas de codificación y resolución de problemas.',
      'Experiencia colaborando de manera sinérgica con equipos multidisciplinarios bajo marcos ágiles (Scrum/Kanban).'
    ];
  }

  lines.forEach((line) => {
    const lower = line.toLowerCase();
    let replaced = false;
    for (const [key, val] of Object.entries(dictionary)) {
      if (lower.includes(key)) {
        formatted.push(val);
        replaced = true;
        break;
      }
    }
    if (!replaced) {
      let clean = line.trim();
      if (clean) {
        clean = clean.charAt(0).toUpperCase() + clean.slice(1);
        if (!clean.endsWith('.')) {
          clean += '.';
        }
        formatted.push(clean);
      }
    }
  });

  if (formatted.length < 3) {
    formatted.push('Capacidad demostrada de adaptabilidad al cambio y asimilación rápida de metodologías de la empresa.');
  }

  return formatted;
};

const createMockCampaign = (data) => {
  const selectedPortals = data.selected_portals || mockPortals.filter((portal) => data.portales.includes(portal.id));
  const newCamp = {
    id: 'camp-' + Date.now(),
    estado: 'borrador',
    status: 'borrador',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    portales: selectedPortals.map((portal) => ({
      portal_id: portal.id,
      nombre_portal: portal.nombre,
      estado: 'pendiente',
      costo_estimado: portal.costo_estimado ?? portal.costo_base ?? 0,
      url_publicacion: null,
      id_externo: null,
      intentos: 0,
      ultimo_intento: null,
      error_msg: null,
      publicado_en: null,
    })),
    ...data,
  };
  newCamp.portal_status = Object.fromEntries(newCamp.portales.map((portal) => [portal.portal_id, portal.estado]));
  mockCampaigns.push(newCamp);
  return newCamp;
};

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
      console.warn('401 Unauthorized caught by interceptor.');
    } else if (error.response?.status === 403) {
      console.warn('403 Forbidden caught by interceptor.');
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
    id: 'portal-11', nombre: 'Trabajando Chile', modelo: 'freemium', costo_base: 0,
    paises: ['CL'], costo_estimado: 0
  },
  {
    id: 'portal-12', nombre: 'Laborum Chile', modelo: 'pago', costo_base: 35000,
    paises: ['CL'], costo_estimado: 35000
  },
  {
    id: 'portal-13', nombre: 'Chiletrabajos', modelo: 'gratis', costo_base: 0,
    paises: ['CL'], costo_estimado: 0
  },
  {
    id: 'portal-14', nombre: 'Computrabajo Chile', modelo: 'pago', costo_base: 30000,
    paises: ['CL'], costo_estimado: 30000
  },
  {
    id: 'portal-10', nombre: 'Glassdoor', modelo: 'gratis', costo_base: 0, 
    paises: ['GLOBAL']
  }
];

export const vacanciesApi = {
  getAll: (filters = {}) =>
    withMockFallback(
      () => api.get('/vacancies', { params: filters }).then(unwrapList),
      () => mockVacancies
    ),
  create: (data) =>
    withMockFallback(() => api.post('/vacancies', data).then((res) => res.data), () => {
      const company = mockCompanies.find(c => c.id === data.empresa_id) || { nombre: 'Demo Empresa' };
      const category = mockCategories.find(c => c.id === data.categoria_id) || { nombre: 'Demo Categoría' };
      const nextCodeNumber = mockVacancies.reduce((max, vacancy) => {
        const match = String(vacancy.codigo || '').match(/VAC-(\d+)/i);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0) + 1;
      const newVac = { 
        id: 'vac-' + Date.now(), 
        codigo: data.codigo || `VAC-${String(nextCodeNumber).padStart(3, '0')}`,
        ...data,
        empresa: company,
        categoria: category
      };
      mockVacancies.push(newVac);
      return newVac;
    }),
  getById: (id) =>
    withMockFallback(
      () => api.get(`/vacancies/${id}`).then((res) => res.data),
      () => mockVacancies.find(v => v.id === id)
    ),
  update: (id, data) =>
    api.put(`/vacancies/${id}`, data).then((res) => res.data),
};

export const profilesApi = {
  getAll: (filters = {}) =>
    withMockFallback(
      () => api.get('/profiles', { params: filters }).then(unwrapList),
      () => mockProfiles
    ),
  create: (data) =>
    withMockFallback(() => api.post('/profiles', data).then((res) => res.data), () => {
      const newProf = { id: 'prof-' + Date.now(), ...data };
      mockProfiles.push(newProf);
      return newProf;
    }),
  generateWithAI: (data) =>
    withMockFallback(() => api.post('/profiles/ai/generate', data).then((res) => res.data), async () => {
      // Simulate AI delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const context = data.additional_context || '';
      let desc = `En Sofi estamos en búsqueda de un ${data.job_title} apasionado y proactivo para unirse a nuestro equipo. Buscamos talento con perfil para trabajar en la modalidad de tiempo completo. Valoramos la innovación, el trabajo en equipo y el compromiso con la excelencia. Esta es una excelente oportunidad para desarrollar tu carrera profesional en un entorno dinámico, utilizando un enfoque profesional.`;

      let requisitos = makeProfessionalRequirements([], data.job_title);

      let suggestions = [
        'Agrega una prueba práctica breve durante la entrevista.',
        'Mantén un proceso de selección ágil y transparente.'
      ];

      if (context) {
        // Optimize based on user's current description
        if (context.includes('Descripción actual del puesto:')) {
          try {
            const origDesc = context.split('Descripción actual del puesto:\n')[1].split('\n\n')[0].trim();
            if (origDesc) {
              desc = `En ${data.company_name} nos encontramos en la búsqueda activa de un/a profesional calificado/a para incorporarse como ${data.job_title}.\n\nDescripción del rol:\n${origDesc}\n\nOfrecemos integrarte a un equipo dinámico, con un excelente clima de trabajo y constantes oportunidades para impulsar tu desarrollo profesional.`;
            }
          } catch (e) {
            console.error(e);
          }
        }

        // Optimize based on user's current requirements
        if (context.includes('Requisitos actuales del puesto:')) {
          try {
            const origReqs = context.split('Requisitos actuales del puesto:\n')[1].split('\n\n')[0].trim();
            if (origReqs) {
              const lines = origReqs.split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
              if (lines.length > 0) {
                requisitos = makeProfessionalRequirements(lines, data.job_title);
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        // Suggestions based on what's missing in context
        suggestions = [];
        const lowerContext = context.toLowerCase();
        if (!lowerContext.includes('salario') && !lowerContext.includes('sueldo') && !lowerContext.includes('pago')) {
          suggestions.push('Se recomienda incluir el rango salarial para aumentar la tasa de postulaciones en un 30%.');
        }
        if (!lowerContext.includes('beneficio') && !lowerContext.includes('seguro') && !lowerContext.includes('prestacion')) {
          suggestions.push('Destaca los beneficios no monetarios (seguro de salud, días libres, etc.) para atraer mejor talento.');
        }
        if (requisitos.length > 5) {
          suggestions.push('Tienes muchos requisitos listados. Considera reducir la lista a los 3-4 más esenciales.');
        }
        if (desc.length < 150) {
          suggestions.push('La descripción es algo corta. Te sugerimos expandir las responsabilidades para dar más claridad.');
        }
        if (suggestions.length === 0) {
          suggestions = [
            '¡Tu anuncio se ve muy completo! Recuerda publicar en los horarios de mayor tráfico.',
            'Mantén un proceso de selección ágil y transparente.'
          ];
        }
      }

      return {
        titulo_anuncio: `Excelente oportunidad: ${data.job_title} en ${data.company_name}`,
        descripcion: desc,
        requisitos: requisitos,
        beneficios: ['Sueldo competitivo', 'Excelente ambiente laboral', 'Oportunidades de crecimiento'],
        tipo_jornada: data.job_type || 'tiempo_completo',
        ia_chips: ['innovación', 'liderazgo'],
        suggestions: suggestions
      };
    }),
};

export const portalsApi = {
  getAll: (filters = {}) =>
    withMockFallback(
      () => api.get('/portals', { params: filters }).then((res) => unwrapList(res).map(normalizePortal)),
      () => mockPortals.map(normalizePortal)
    ),
  saveCredentials: (portalId, credentials) =>
    withMockFallback(
      () => api.put(`/portals/${portalId}/credentials`, credentials).then((res) => res.data),
      () => ({ success: true })
    ),
};

export const campaignsApi = {
  getAll: (filters = {}) =>
    withMockFallback(
      () => api.get('/campaigns', { params: filters }).then((res) => unwrapList(res).map(normalizeCampaign)),
      () => mockCampaigns.map(normalizeCampaign)
    ),
  create: (data) =>
    withMockFallback(
      () => api.post('/campaigns', data).then((res) => normalizeCampaign(res.data)),
      () => createMockCampaign(data)
    ),
  getById: (id) =>
    withMockFallback(
      () => api.get(`/campaigns/${id}`).then((res) => normalizeCampaign(res.data)),
      () => {
        const camp = mockCampaigns.find(c => c.id === id);
        if (!camp) return undefined;

        if (camp.estado === 'publicando' && Date.now() - (camp.publish_started_at || 0) > 3000) {
          camp.estado = 'publicada';
          camp.status = 'publicada';
          camp.updated_at = new Date().toISOString();
          camp.portales = camp.portales.map((portal) => ({
            ...portal,
            estado: 'publicada',
            intentos: Math.max(portal.intentos || 0, 1),
            ultimo_intento: portal.ultimo_intento || new Date().toISOString(),
            publicado_en: portal.publicado_en || new Date().toISOString(),
            url_publicacion: portal.url_publicacion || `https://demo.sofi.local/publicaciones/${id}/${portal.portal_id}`,
            id_externo: portal.id_externo || `SOFI-${portal.portal_id}-${String(id).slice(-5)}`,
          }));
          camp.portal_status = Object.fromEntries(camp.portales.map((portal) => [portal.portal_id, portal.estado]));
        }

        return camp;
      }
    ),
  publish: (id) =>
    withMockFallback(
      () => api.post(`/campaigns/${id}/publish`).then((res) => normalizeCampaign(res.data)),
      async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
        const camp = mockCampaigns.find(c => c.id === id);
        if (camp) {
          camp.estado = 'publicando';
          camp.status = 'publicando';
          camp.publish_started_at = Date.now();
          camp.updated_at = new Date().toISOString();
          camp.portales = camp.portales.map((portal) => ({
            ...portal,
            estado: 'publicando',
            intentos: (portal.intentos || 0) + 1,
            ultimo_intento: new Date().toISOString(),
          }));
          camp.portal_status = Object.fromEntries(camp.portales.map((portal) => [portal.portal_id, portal.estado]));
        }
        return camp;
      }
    ),
  cancel: (id) =>
    api.patch(`/campaigns/${id}`, { estado: 'cancelada' }).then((res) => normalizeCampaign(res.data)),
};

export const paymentsApi = {
  create: (data) =>
    withMockFallback(
      () => api.post('/payments', data).then((res) => res.data),
      () => ({
        id: 'pay-' + Date.now(),
        client_secret: 'mock_stripe_secret_' + Date.now(),
        amount: data.monto,
        currency: data.moneda,
        payment_intent_id: 'pi_' + Date.now(),
      })
    ),
  getById: (id) =>
    api.get(`/payments/${id}`).then((res) => res.data),
  initiateTransbank: (data) =>
    withMockFallback(
      () => api.post('/payments/transbank/initiate', data).then((res) => res.data),
      () => ({
        token: 'mock_token_' + Date.now(),
        url: 'https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions',
        payment_id: 'pay-' + Date.now()
      })
    ),
  commitTransbank: (data) =>
    withMockFallback(
      () => api.post('/payments/transbank/commit', data).then((res) => res.data),
      () => ({
        status: 'approved',
        detail: {
          response_code: 0,
          status: 'AUTHORIZED',
          amount: data.amount || 15000,
          buy_order: 'ORD-12345',
          session_id: 'SESS-12345',
        }
      })
    ),
};

export const companiesApi = {
  getAll: () =>
    withMockFallback(
      () => api.get('/companies').then(unwrapList),
      () => mockCompanies
    ),
  create: (data) =>
    withMockFallback(() => api.post('/companies', data).then((res) => res.data), () => {
      const newCompany = { id: 'comp-' + Date.now(), ...data };
      mockCompanies.push(newCompany);
      return newCompany;
    }),
};

export const categoriesApi = {
  getAll: () =>
    withMockFallback(
      () => api.get('/categories').then(unwrapList),
      () => mockCategories
    ),
  create: (data) =>
    withMockFallback(() => api.post('/categories', data).then((res) => res.data), () => {
      const newCategory = { id: 'cat-' + Date.now(), ...data };
      mockCategories.push(newCategory);
      return newCategory;
    }),
};

export default api;
