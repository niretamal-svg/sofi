# Sofi Publicación en Portales - Frontend

Frontend de React 18 para la plataforma de publicación de vacantes en múltiples portales.

## Características

- 🔐 Autenticación con Firebase
- 🎨 Interfaz moderna con TailwindCSS
- 📝 Formularios con React Hook Form
- 🌍 Multi-país y multi-portal
- 🤖 Integración con IA para generación de perfiles
- 💳 Sistema de pagos integrado
- 📊 Gestión de campañas de publicación

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Crear archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

3. Configurar variables de entorno con tu Firebase config y API URL

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en http://localhost:5173

## Build para producción

```bash
npm run build
```

## Estructura de archivos

```
src/
  ├── components/
  │   ├── common/          # Componentes reutilizables
  │   ├── layout/          # Layout principal
  │   └── publication/     # Componentes del wizard
  ├── contexts/            # Auth context
  ├── pages/              # Páginas principales
  ├── services/           # API client
  ├── store/              # Zustand store
  ├── App.jsx
  ├── main.jsx
  ├── firebase.js
  └── index.css
```

## Flujo de publicación

1. **Step 1 - Vacante**: Seleccionar o crear una vacante
2. **Step 2 - Perfil**: Generar o crear un perfil de publicación
3. **Step 3 - Portales**: Seleccionar países y portales
4. **Step 4 - Publicar**: Revisar, pagar y publicar

## Diseño

- **Color primario**: #6B3FA0 (Púrpura Sofi)
- **Color de acento**: #00C9A7 (Teal)
- **Tipografía**: DM Sans (principal), DM Mono (números)
- **Animaciones**: Transiciones suaves de 150ms

## API

La aplicación se comunica con la API en `VITE_API_URL` (por defecto: http://localhost:8000/api/v1)

### Endpoints principales:

- `GET/POST /vacancies` - Gestión de vacantes
- `GET/POST /profiles` - Gestión de perfiles
- `GET /portals` - Listado de portales
- `POST /campaigns` - Crear campañas
- `POST /campaigns/:id/publish` - Publicar campaña

## Configuración de Firebase

1. Crear proyecto en Firebase Console
2. Copiar credenciales en `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

## Licencia

© 2024 Sofi. Todos los derechos reservados.
