# Paso a paso: cómo y dónde colocar cada archivo

## 1) Crear la carpeta raíz
Crea una carpeta llamada `sofi-starter`.

Dentro debes tener exactamente esto:

```text
sofi-starter/
├─ api/
├─ web/
├─ infra/
├─ docker-compose.yml
└─ README.md
```

---

## 2) Backend
Todo el backend va dentro de `api/`.

### 2.1 Copia estos archivos en `api/`
- `package.json`
- `.env.example`
- `src/server.js`
- `src/app.js`
- `src/config/env.js`
- `src/config/db.js`
- `src/utils/apiResponse.js`
- `src/utils/logger.js`
- `src/middlewares/errorHandler.js`
- `src/middlewares/authenticateToken.js`
- `src/models/User.js`
- `src/services/authService.js`
- `src/controllers/authController.js`
- `src/routes/index.js`
- `src/routes/healthRoutes.js`
- `src/routes/authRoutes.js`

### 2.2 Instalar dependencias
Abre terminal dentro de `api/` y ejecuta:

```bash
npm install
```

### 2.3 Crear archivo `.env`
Duplica `.env.example` y renómbralo a `.env`.

Después completa tus valores:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/sofi_db
JWT_SECRET=super_secret_change_me
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:5173
```

### 2.4 Ejecutar backend
```bash
npm run dev
```

Si todo está bien, verás:
- API corriendo en `http://localhost:3000`
- Health check en `http://localhost:3000/api/v1/health`

---

## 3) Frontend
Todo el frontend va dentro de `web/`.

### 3.1 Copia estos archivos en `web/`
- `package.json`
- `.env.example`
- `index.html`
- `vite.config.js`
- `src/main.jsx`
- `src/App.jsx`
- `src/pages/LoginPage.jsx`
- `src/contexts/AuthContext.jsx`
- `src/services/api.js`
- `src/store/useAuthStore.js`
- `src/styles.css`

### 3.2 Instalar dependencias
Abre terminal dentro de `web/` y ejecuta:

```bash
npm install
```

### 3.3 Crear archivo `.env`
Duplica `.env.example` a `.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 3.4 Ejecutar frontend
```bash
npm run dev
```

Abre:
- `http://localhost:5173`

---

## 4) MongoDB
Tienes dos opciones.

### Opción A: MongoDB local
Instala MongoDB localmente y usa:

```env
MONGO_URI=mongodb://localhost:27017/sofi_db
```

### Opción B: Docker
Desde la raíz del proyecto ejecuta:

```bash
docker compose up --build
```

Esto levanta:
- API
- Web
- MongoDB
- Redis

---

## 5) Crear usuario admin de prueba
Cuando el backend esté corriendo, haz una petición POST a:

```text
http://localhost:3000/api/v1/auth/seed-admin
```

Eso crea:
- email: `admin@sofi.local`
- password: `Admin12345*`

---

## 6) Probar login
En el frontend usa:
- email: `admin@sofi.local`
- password: `Admin12345*`

---

## 7) Qué mostrar en la primera entrega
Muestra esto:
1. Estructura del proyecto.
2. API funcionando.
3. Mongo conectado.
4. Login funcionando.
5. Docker listo.
6. README y `.env.example` documentados.

---

## 8) Importante sobre tu ZIP actual
El ZIP que subiste trae backend en **FastAPI + Firebase/Firestore + Stripe/Gemini**.
Ese código sirve como referencia visual y funcional, pero **no está alineado al stack principal de la planificación Scrum**, que pide **Node.js + Express + MongoDB + Redis + React**.

Por eso este starter lo dejé alineado con la documentación oficial del proyecto.
