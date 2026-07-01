# Quick Reference - Snippets y Operaciones Comunes

## Iniciar un nuevo proyecto

```bash
cd /path/to/frontend
cp .env.example .env
# Editar .env con credenciales de Firebase y API URL
npm install
npm run dev
```

## Estructura típica de un componente paso a paso

```javascript
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { usePublicationStore } from '../../store/publicationStore';
import { someApi } from '../../services/api';

export default function MyComponent() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { selectedValue, setSelectedValue, setStep } = usePublicationStore();

  useEffect(() => {
    // Llamadas iniciales
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await someApi.create(data);
      setSelectedValue(result);
      toast.success('Éxito!');
    } catch (error) {
      toast.error('Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Contenido */}
    </form>
  );
}
```

## Patrones de UI comunes

### Tab Buttons
```javascript
const [activeTab, setActiveTab] = useState('tab1');

const TabButton = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium border-b-2 transition-colors duration-150 ${
      active
        ? 'border-sofi-purple text-sofi-purple'
        : 'border-transparent text-gray-600 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);

return (
  <>
    <div className="border-b border-gray-200 mb-6">
      <TabButton active={activeTab === 'tab1'} onClick={() => setActiveTab('tab1')}>
        Tab 1
      </TabButton>
      <TabButton active={activeTab === 'tab2'} onClick={() => setActiveTab('tab2')}>
        Tab 2
      </TabButton>
    </div>

    {activeTab === 'tab1' && <Content1 />}
    {activeTab === 'tab2' && <Content2 />}
  </>
);
```

### Modal
```javascript
const [open, setOpen] = useState(false);

return (
  <>
    <button onClick={() => setOpen(true)}>Abrir</button>

    {open && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-lg font-semibold mb-4">Título</h3>

          {/* Contenido */}

          <div className="flex gap-3 mt-6">
            <button onClick={() => setOpen(false)} className="flex-1 btn-secondary">
              Cancelar
            </button>
            <button onClick={handleSubmit} className="flex-1 btn-primary">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
```

### Tabla con filtros
```javascript
const [items, setItems] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
const [filterStatus, setFilterStatus] = useState('');

const filtered = items.filter((item) => {
  const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
  const matchStatus = !filterStatus || item.status === filterStatus;
  return matchSearch && matchStatus;
});

return (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <input
        placeholder="Buscar..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="input-primary"
      />
      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-primary">
        <option value="">Todos</option>
        <option value="activo">Activo</option>
        <option value="inactivo">Inactivo</option>
      </select>
    </div>

    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4 text-sm font-medium">Nombre</th>
          <th className="text-left py-3 px-4 text-sm font-medium">Estado</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((item) => (
          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4">{item.name}</td>
            <td className="py-3 px-4">{item.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
```

### Card con selección
```javascript
const [selected, setSelected] = useState(null);

return (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {items.map((item) => (
      <div
        key={item.id}
        onClick={() => setSelected(item)}
        className={`card p-4 cursor-pointer transition-all duration-150 ${
          selected?.id === item.id ? 'ring-2 ring-sofi-purple' : 'hover:shadow-md'
        }`}
      >
        <h4 className="font-semibold text-gray-900">{item.title}</h4>
        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
      </div>
    ))}
  </div>
);
```

### Form con React Hook Form
```javascript
const { register, handleSubmit, watch, formState: { errors } } = useForm({
  defaultValues: { name: '', email: '' },
});

const onSubmit = async (data) => {
  try {
    await api.create(data);
    toast.success('Creado!');
  } catch (error) {
    toast.error('Error');
  }
};

return (
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Nombre *
      </label>
      <input
        {...register('name', { required: 'El nombre es requerido' })}
        className="input-primary"
        placeholder="Tu nombre"
      />
      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email *
      </label>
      <input
        type="email"
        {...register('email', {
          required: 'El email es requerido',
          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
        })}
        className="input-primary"
        placeholder="tu@email.com"
      />
      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
    </div>

    <button type="submit" className="btn-primary">
      Enviar
    </button>
  </form>
);
```

### Sidebar Sticky
```javascript
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Contenido principal */}
  </div>

  <div className="lg:col-span-1">
    <div className="card p-6 h-fit sticky top-6 space-y-4">
      {/* Sidebar que se queda visible al scroll */}
    </div>
  </div>
</div>
```

### Loading States
```javascript
{loading ? (
  <div className="space-y-2">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
    ))}
  </div>
) : items.length === 0 ? (
  <div className="text-center py-8 text-gray-500">
    No hay elementos
  </div>
) : (
  // Contenido real
)}
```

### Spinner
```javascript
<div className="flex items-center justify-center gap-2">
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  <span>Cargando...</span>
</div>
```

## Usar API

### GET simple
```javascript
import { vacanciesApi } from '../../services/api';

useEffect(() => {
  const fetch = async () => {
    try {
      const data = await vacanciesApi.getAll({ estado: 'activa' });
      setVacancies(data);
    } catch (error) {
      toast.error('Error');
    }
  };
  fetch();
}, []);
```

### POST con validación
```javascript
const onSubmit = async (data) => {
  setLoading(true);
  try {
    const result = await vacanciesApi.create(data);
    toast.success('Vacante creada!');
    setVacancies([...vacancies, result]);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Error');
  } finally {
    setLoading(false);
  }
};
```

## Usar Zustand Store

### Lectura y escritura
```javascript
const { selectedVacancy, setSelectedVacancy, currentStep, setStep } = usePublicationStore();

// Leer
console.log(selectedVacancy);

// Escribir
setSelectedVacancy(vacancy);
setStep(2);
```

### Toggle (add/remove)
```javascript
const { selectedPortals, togglePortal } = usePublicationStore();

const handleToggle = (portal) => {
  togglePortal(portal);
};

// Checar si está seleccionado
const isSelected = selectedPortals.some((p) => p.id === portal.id);
```

## Usar Auth Context

```javascript
import { useAuth } from '../contexts/AuthContext';

const { user, loading, login, logout } = useAuth();

// En el componente
const handleLogin = async () => {
  try {
    await login(email, password);
    navigate('/publication');
  } catch (error) {
    toast.error(error.message);
  }
};

const handleLogout = async () => {
  await logout();
  navigate('/login');
};

// Información del usuario
<p>{user?.email}</p>
```

## Badges

```javascript
import StatusBadge from '../common/StatusBadge';

// Gratis
<StatusBadge variant="gratis" />

// Pago
<StatusBadge variant="pago" />

// Freemium
<StatusBadge variant="freemium" />

// Personalizado
<StatusBadge variant="publicado" label="Publicado" />
```

## Colores personalizados

```javascript
// Fondo
className="bg-sofi-purple"  // #6B3FA0
className="bg-sofi-teal"    // #00C9A7
className="bg-status-free"  // #10B981

// Texto
className="text-sofi-purple"
className="text-sofi-teal"

// Light variants
className="bg-sofi-purple-light"  // #F3ECFF
className="bg-sofi-teal-light"    // #E8FDF7
```

## Animaciones

```javascript
// Spin
<div className="animate-spin">...</div>

// Pulse lento
<div className="animate-pulse-slow">...</div>

// Transición suave
className="transition-all duration-150"
```

## Validaciones de formularios comunes

```javascript
// Email
{...register('email', {
  required: 'El email es requerido',
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email inválido',
  },
})}

// Número mínimo
{...register('edad', {
  required: 'Requerido',
  min: { value: 18, message: 'Mínimo 18' },
})}

// Longitud máxima
{...register('descripcion', {
  maxLength: { value: 1000, message: 'Máximo 1000 caracteres' },
})}

// Dependencia de otro field
{...register('confirmPassword', {
  validate: (value) => value === watch('password') || 'Las contraseñas no coinciden',
})}
```

## Debug útil

```javascript
// Ver estado del store en consola
import { usePublicationStore } from '../../store/publicationStore';

const state = usePublicationStore((state) => state);
console.log('Publication state:', state);

// Ver errores de formulario
console.log('Form errors:', errors);

// Ver datos de formulario
console.log('Form data:', watch());

// Ver API requests en DevTools
// F12 → Network tab → Filter por /api
```

## Estructura típica de página

```javascript
export default function MyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Topbar */}
      <Topbar />

      {/* Main content container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Título</h1>
          <p className="text-gray-600">Breadcrumb</p>
        </div>

        {/* Componente principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Contenido */}
        </div>
      </div>
    </div>
  );
}
```

## Commits útiles después de cambios

```bash
# Agregar un nuevo componente
git add src/components/newComponent/
git commit -m "feat: add NewComponent"

# Cambios en estilos
git commit -m "style: update Tailwind config"

# Bugfix
git commit -m "fix: handle API error on Step1"

# Refactor
git commit -m "refactor: extract TabButton to common component"
```

## Troubleshooting rápido

```javascript
// "Cannot read property 'id' of undefined"
// Solución: Validar antes de acceder
{selectedVacancy?.id || 'No seleccionada'}

// "useAuth must be used within an AuthProvider"
// Solución: Verificar que está dentro de AuthProvider en main.jsx

// "Styles not applying"
// Solución: Verificar que Tailwind está en content del config

// API returns 401
// Solución: Token de Firebase expirado, hacer logout/login
```
