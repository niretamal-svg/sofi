import React, { createContext, useContext, useEffect, useState } from 'react';

const AppSettingsContext = createContext();

const STORAGE_KEYS = {
  theme: 'sofiTheme',
  locale: 'sofiLocale',
};

const translations = {
  es: {
    appName: 'SOFI',
    activeUser: 'Usuario activo',
    guestUser: 'Invitado',
    logout: 'Cerrar sesión',
    dayMode: 'Día',
    nightMode: 'Noche',
    switchToDark: 'Activar modo noche',
    switchToLight: 'Activar modo día',
    languageLabel: 'Idioma',
    loginTitle: 'Bienvenido de nuevo',
    registerTitle: 'Crea tu cuenta profesional',
    forgotTitle: 'Recupera el acceso',
    loginSubtitle: 'Ingresa con tu correo y contraseña.',
    registerSubtitle: 'Regístrate rápido y comienza a publicar.',
    forgotSubtitle: 'Te enviaremos un enlace para restablecer tu contraseña.',
    nameLabel: 'Nombre',
    namePlaceholder: 'Ej. Ana Márquez',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'correo@empresa.com',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: '••••••••',
    loginButton: 'Ingresar',
    registerButton: 'Registrarse',
    sendLinkButton: 'Enviar enlace',
    continueWith: 'o continúa con',
    googleButton: 'Google',
    microsoftButton: 'Microsoft',
    noAccount: '¿No tienes una cuenta?',
    alreadyAccount: '¿Ya tienes una cuenta?',
    signUpHere: 'Regístrate aquí',
    logIn: 'Inicia sesión',
    forgotPassword: '¿Olvidaste tu contraseña?',
    roleRecruiter: 'Reclutador',
    dashboardPanel: 'Panel de control',
    dashboardTitle: 'Bienvenido a Sofi',
    dashboardSubtitle: 'Gestiona vacantes, crea perfiles con IA y publica en portales desde un solo lugar.',
    publishVacancy: '✦ Publicar vacante',
    activeVacancies: 'Vacantes activas',
    profilesCreated: 'Perfiles IA creados',
    campaignsPublished: 'Campañas publicadas',
    publicationTitle: 'Publicación de vacantes de empleo',
    publicationSubtitle: 'Define el perfil, elige portales y publica tu vacante en un flujo claro.',
    menuLabel: 'Menú',
    publicationNav: 'Publicación',
    loading: 'Cargando...',
  },
  en: {
    appName: 'SOFI',
    activeUser: 'Active user',
    guestUser: 'Guest',
    logout: 'Log out',
    dayMode: 'Day',
    nightMode: 'Night',
    switchToDark: 'Switch to dark mode',
    switchToLight: 'Switch to light mode',
    languageLabel: 'Language',
    loginTitle: 'Welcome back',
    registerTitle: 'Create your professional account',
    forgotTitle: 'Recover access',
    loginSubtitle: 'Sign in with your email and password.',
    registerSubtitle: 'Register quickly and start publishing.',
    forgotSubtitle: 'We will send you a link to reset your password.',
    nameLabel: 'Name',
    namePlaceholder: 'Ex. Ana Márquez',
    emailLabel: 'Email address',
    emailPlaceholder: 'email@company.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    loginButton: 'Sign in',
    registerButton: 'Sign up',
    sendLinkButton: 'Send link',
    continueWith: 'or continue with',
    googleButton: 'Google',
    microsoftButton: 'Microsoft',
    noAccount: 'Don’t have an account?',
    alreadyAccount: 'Already have an account?',
    signUpHere: 'Sign up here',
    logIn: 'Log in',
    forgotPassword: 'Forgot your password?',
    roleRecruiter: 'Recruiter',
    dashboardPanel: 'Dashboard',
    dashboardTitle: 'Welcome to Sofi',
    dashboardSubtitle: 'Manage vacancies, create AI profiles, and publish on portals from one place.',
    publishVacancy: '✦ Publish vacancy',
    activeVacancies: 'Active vacancies',
    profilesCreated: 'AI profiles created',
    campaignsPublished: 'Campaigns published',
    publicationTitle: 'Portal publication',
    publicationSubtitle: 'Define the profile, choose portals, and publish your vacancy in a clear flow.',
    menuLabel: 'Menu',
    publicationNav: 'Publication',
    loading: 'Loading...',
  },
};

const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

export function AppSettingsProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [locale, setLocale] = useState('es');

  useEffect(() => {
    const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    const storedLocale = localStorage.getItem(STORAGE_KEYS.locale);

    const initialTheme = storedTheme === 'dark' ? 'dark' : 'light';
    const initialLocale = storedLocale === 'en' ? 'en' : 'es';

    setTheme(initialTheme);
    setLocale(initialLocale);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.locale, locale);
  }, [locale]);

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  const toggleLocale = () => setLocale((current) => (current === 'es' ? 'en' : 'es'));

  const t = (key) => translations[locale][key] ?? translations.es[key] ?? key;

  return (
    <AppSettingsContext.Provider value={{ theme, locale, toggleTheme, toggleLocale, t }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
}
