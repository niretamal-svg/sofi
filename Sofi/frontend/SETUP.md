# Setup Guide - Sofi Frontend

## Quick Start

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un nuevo proyecto o usa uno existente
3. En "Configuración del proyecto" → "General", copia la config web
4. Renombra `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
5. Completa las variables de Firebase:
   ```
   VITE_FIREBASE_API_KEY=tu_api_key
   VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
   VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   VITE_FIREBASE_APP_ID=tu_app_id
   ```

### 3. Configurar API

En `.env`, configura la URL de tu API:
```
VITE_API_URL=http://localhost:8000/api/v1
```

### 4. Stripe (Opcional - para pagos)

```
VITE_STRIPE_PUBLISHABLE_KEY=tu_stripe_key
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La app estará en http://localhost:5173

## Estructura de componentes

### Páginas (`src/pages/`)
- `LoginPage.jsx` - Autenticación
- `PublicationPage.jsx` - Wizard principal

### Componentes (`src/components/`)

#### Layout
- `Topbar.jsx` - Barra superior con usuario y logout

#### Common (Reutilizables)
- `Stepper.jsx` - Indicador de progreso de 4 pasos
- `StatusBadge.jsx` - Badges de estado (Gratis, Pago, etc)
- `PortalCredentialsModal.jsx` - Modal para credenciales de portales

#### Publication (Wizard steps)
- `Step1Vacancy.jsx` - Seleccionar/crear vacante
- `Step2Profile.jsx` - Generar/cargar/crear perfil
- `Step3Portals.jsx` - Seleccionar países y portales
- `Step4Confirm.jsx` - Revisar y publicar

### Servicios (`src/services/`)
- `api.js` - Cliente Axios con interceptores

### Estado (`src/store/`)
- `publicationStore.js` - Zustand store para el wizard

### Autenticación (`src/contexts/`)
- `AuthContext.jsx` - Context de Firebase Auth

### Configuración
- `firebase.js` - Inicialización de Firebase
- `index.css` - Estilos globales y componentes Tailwind
- `tailwind.config.js` - Configuración de Tailwind (colores, fonts, etc)

## Diseño System

### Colores
- **Púrpura Sofi**: `#6B3FA0` (primario)
- **Teal Sofi**: `#00C9A7` (acento)
- **Verde (Gratis)**: `#10B981`
- **Amarillo (Pago)**: `#FBBF24`
- **Azul (Freemium)**: `#3B82F6`

### Tipografía
- **Principal**: DM Sans
- **Mono (números)**: DM Mono

### Clases Tailwind Personalizadas

```jsx
// Botones
<button className="btn-primary">Primario</button>
<button className="btn-secondary">Secundario</button>
<button className="btn-ghost">Ghost</button>

// Inputs
<input className="input-primary" />
<input className="input-error" />

// Tarjetas
<div className="card p-4">Card</div>

// Badges
<span className="badge-free">Gratis</span>
<span className="badge-paid">Pago</span>
<span className="badge-freemium">Freemium</span>
```

## Flujo de datos

### 1. Autenticación
```
Firebase Auth → AuthContext (global state) → ProtectedRoute
```

### 2. Publicación
```
Step1: SelectVacancy → Store
Step2: SelectProfile → Store
Step3: SelectPortals → Store
Step4: CreateCampaign → API → Poll status
```

### 3. API Calls
```
useForm (inputs) → onSubmit → api.js → interceptor adds token → Backend
```

## Comandos disponibles

```bash
npm run dev      # Desarrollo con hot reload
npm run build    # Build para producción
npm run preview  # Preview del build
```

## Variables de entorno necesarias

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# API
VITE_API_URL=http://localhost:8000/api/v1

# Stripe (Opcional)
VITE_STRIPE_PUBLISHABLE_KEY=
```

## Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 5173 already in use
```bash
npm run dev -- --port 3000
```

### Firebase auth errors
- Verifica que Firebase esté inicializado con las credenciales correctas
- Revisa que el dominio esté añadido en Firebase Console → Configuración → Dominios autorizados

### API no responde
- Asegúrate que el backend está corriendo en http://localhost:8000
- Verifica VITE_API_URL en .env
- Abre DevTools → Network para ver las requests

## Proxying API requests

En `vite.config.js` está configurado un proxy para `/api`:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

Esto permite llamar a `/api/v1/...` sin CORS issues.
