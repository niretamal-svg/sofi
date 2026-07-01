# Estructura de archivos - Frontend Sofi

## Archivos raíz

```
.env.example              # Variables de entorno de ejemplo
.gitignore               # Archivos a ignorar en git
index.html               # HTML principal con punto de entrada
package.json             # Dependencias y scripts
postcss.config.js        # Configuración de PostCSS para Tailwind
tailwind.config.js       # Configuración de Tailwind (colores, fonts, etc)
vite.config.js          # Configuración de Vite (dev server, proxy)
README.md               # Documentación principal
SETUP.md                # Guía de configuración inicial
FILE_STRUCTURE.md       # Este archivo
```

## Directorio `/src`

### `/src/main.jsx`
Punto de entrada de React. Inicializa:
- React 18 con createRoot
- BrowserRouter para enrutamiento
- Toaster para notificaciones

### `/src/App.jsx`
Configuración de rutas principales:
- `/login` → LoginPage (pública)
- `/publication` → PublicationPage (protegida)
- `/` → Redirige a /publication
- ProtectedRoute component para validar autenticación

### `/src/index.css`
Estilos globales:
- Importa Tailwind (base, components, utilities)
- Estilos personalizados: scrollbar, custom components
- Clases Tailwind extendidas: btn-*, input-*, badge-*, card

### `/src/firebase.js`
Configuración de Firebase:
- initializeApp con variables de entorno
- Exporta: auth, db
- Usa variables VITE_FIREBASE_*

## Directorio `/src/contexts`

### `AuthContext.jsx`
Context de autenticación:
- Proveedor global con onAuthStateChanged
- Hook useAuth() para acceder a user, loading, login, logout, getToken
- Integración con Firebase Auth

## Directorio `/src/services`

### `api.js`
Cliente Axios configurado:
- baseURL: VITE_API_URL
- Interceptor de request: agrega Bearer token de Firebase
- Interceptor de response: maneja 401 (redirect login), 403 (toast error)
- Métodos exportados:
  - vacanciesApi: getAll, create, getById, update
  - profilesApi: getAll, create, generateWithAI
  - portalsApi: getAll, saveCredentials
  - campaignsApi: create, getById, publish, cancel
  - paymentsApi: create, getById
  - companiesApi: getAll
  - categoriesApi: getAll

## Directorio `/src/store`

### `publicationStore.js`
Zustand store para el wizard de publicación:
- selectedVacancy / setSelectedVacancy
- selectedProfile / setSelectedProfile
- selectedCountries / setSelectedCountries
- selectedPortals / togglePortal
- campaign / setCampaign
- currentStep / setStep
- reset() para reiniciar

## Directorio `/src/pages`

### `LoginPage.jsx`
Página de autenticación:
- Formulario con email + contraseña
- React Hook Form para validación
- Firebase signInWithEmailAndPassword
- Interfaz con gradiente púrpura
- Manejo de errores con toast

### `PublicationPage.jsx`
Página principal del wizard:
- Topbar con usuario y logout
- Breadcrumb: Dashboard > Publicar vacante
- Stepper de 4 pasos
- Renderiza Step1, Step2, Step3 o Step4 según currentStep
- Toda la lógica en componentes separados

## Directorio `/src/components/layout`

### `Topbar.jsx`
Barra superior con:
- Logo Sofi
- Avatar con iniciales del usuario
- Nombre y email del usuario
- Botón de logout
- Fondo púrpura

## Directorio `/src/components/common`

### `Stepper.jsx`
Indicador de progreso:
- 4 pasos: Vacante, Perfil, Portales, Publicar
- Estados: activo (púrpura), completado (teal con checkmark), inactivo (gris)
- Líneas conectoras entre pasos
- Clickeable para navegar (solo hacia adelante si no está completado)

### `StatusBadge.jsx`
Badges de estado reutilizables:
- Variantes: gratis, pago, freemium, publicado, publicando, error, pendiente
- Colores automáticos según variante
- Soporta animate-pulse-slow para publicando

### `PortalCredentialsModal.jsx`
Modal para guardar credenciales de portales:
- Campos: usuario/email, contraseña
- Cifra credenciales en backend
- Manejo de errores con toast
- React Hook Form para validación

## Directorio `/src/components/publication`

### `Step1Vacancy.jsx`
Primer paso del wizard - Seleccionar/crear vacante:
- Dos tabs: "Vacantes existentes" | "Crear nueva vacante"
- Tab 1: Tabla filtrable con búsqueda, estado, empresa
  - Columnas: Código, Nombre, Empresa, Categoría, Estado
  - Selección por click en fila
  - Loading skeleton
- Tab 2: Formulario para crear nueva vacante
  - Campos: nombre*, empresa*, categoría*, estado*, descripción
  - Select dropdowns para empresa y categoría
- Sidebar derecho: Resumen de vacante seleccionada
- Botón "Continuar" (disabled sin selección)

### `Step2Profile.jsx`
Segundo paso - Generar/cargar/crear perfil:
- Tres tabs: "Generar con IA" | "Cargar existente" | "Crear manualmente"
- Tab 1: Generador de IA
  - Banner morado con "Sofi AI genera tu descripción optimizada"
  - Inputs: descripción (textarea 1000 chars), nivel_experiencia, tono
  - Botón "✦ Generar con IA" con spinner
  - Muestra sugerencias en panel amarillo
- Tab 2: Galería de perfiles guardados
  - Grid de cards con preview
  - Botón "Usar" en cada card
  - Selección por click
- Tab 3: Formulario manual
  - Campos: titulo_anuncio, tipo_jornada, salario min/max, moneda, ubicación, descripción
- Bottom: "← Regresar", "👁 Previsualizar" (abre modal), "Continuar →"
- Preview modal: mockup del anuncio en estilo genérico

### `Step3Portals.jsx`
Tercer paso - Seleccionar países y portales:
- Multi-select de países: México, Guatemala, Honduras, El Salvador, Nicaragua, US, Global
- Tabla filtrable de portales:
  - Columnas: Logo+Nombre, Tipo badge, Modelo badge, Costo
  - Checkboxes para seleccionar
  - Filter tabs: Todos, Solo gratis, De pago, Freemium
- Sidebar sticky derecho:
  - Resumen de portales seleccionados
  - Desglose de costo: gratis, de pago individual, total
  - Advertencia de costos estimados
  - Panel de recomendación de IA
- Navigation: "← Regresar", "Continuar → Revisar y publicar"

### `Step4Confirm.jsx`
Cuarto paso - Revisar y publicar:
- Sección 1: Resumen de campaña
  - Info de vacante
  - Lista de portales con indicadores de estado:
    - ✓ Publicado (verde)
    - ⏳ Publicando (teal animado)
    - 💳 Pendiente pago (gris)
    - ✗ Error (rojo)
  - Polling cada 3 segundos para actualizar estado
- Sección 2: Desglose de pagos (si hay portales de pago)
  - Tabla con Portal, Costo, Tipo
  - Total a pagar en dm-mono
  - Selector de método de pago: Tarjeta, Transferencia, Crédito Sofi
- Sidebar:
  - Resumen de selecciones (✓ Vacante, Perfil, Portales)
  - Conteo de portales
  - Total estimado
  - Botón principal "🚀 Iniciar publicación"
  - Botón "← Nueva publicación" (resetea store)
  - Botón "Editar portales"

## Estructura de componentes (árbol)

```
App
├── AuthProvider
│   └── Routes
│       ├── /login → LoginPage
│       └── /publication → ProtectedRoute → PublicationPage
│           ├── Topbar
│           ├── Stepper
│           └── [Step1Vacancy | Step2Profile | Step3Portals | Step4Confirm]
│               └── Componentes internos (TabButton, etc)
```

## Convenciones usadas

### Archivos
- `.jsx` para componentes React
- `.js` para servicios y configuración
- `.css` solo para index.css (todo lo demás es Tailwind)

### Nombres
- PascalCase para componentes React
- camelCase para funciones y variables
- UPPERCASE para constantes

### Estados
- Zustand para estado global (publicationStore)
- React Hook Form para formularios
- useState para estado local temporal

### Estilos
- Tailwind classes en JSX (sin CSS files separados)
- Clases custom en index.css layer components
- Colores personalizados en tailwind.config.js

### API
- axios con interceptores
- Métodos agrupados por recurso (vacanciesApi, etc)
- Manejo de errores centralizado

## Rutas de importación comunes

```javascript
// Contextos
import { useAuth } from '../contexts/AuthContext';

// Store
import { usePublicationStore } from '../store/publicationStore';

// API
import { vacanciesApi, profilesApi, ... } from '../services/api';

// Componentes
import Stepper from '../components/common/Stepper';
import Step1Vacancy from '../components/publication/Step1Vacancy';
```

## Patrones utilizados

### 1. Custom Hooks
```javascript
const { user, loading, login, logout } = useAuth();
const { selectedVacancy, setStep } = usePublicationStore();
```

### 2. React Hook Form
```javascript
const { register, handleSubmit, watch, formState: { errors } } = useForm();
// Validación declarativa en register
```

### 3. Tabs Component Pattern
```javascript
const [activeTab, setActiveTab] = useState('tab1');
// Renderizar contenido según activeTab
```

### 4. Sidebar Sticky
```javascript
<div className="sticky top-6 h-fit">
  // Sidebar content que se queda visible al scroll
</div>
```

## Configuración de Tailwind

En `tailwind.config.js`:
- Colores extendidos: sofi-purple, sofi-teal, status-* colors
- Fuentes: dm-sans, dm-mono
- Animaciones: pulse-slow
- Durations: 150ms para transiciones

En `index.css`:
- Layer components: btn-*, input-*, card, badge*
- Focus ring: 3px purple outline
- Scrollbar personalizado
