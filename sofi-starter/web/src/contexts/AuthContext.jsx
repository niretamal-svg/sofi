import { createContext, useContext, useMemo } from 'react';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { token, user, setAuth, clearAuth } = useAuthStore();

  const value = useMemo(
    () => ({
      token,
      user,
      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        setAuth(data.data.access_token, data.data.user);
      },
      logout: () => {
        clearAuth();
      }
    }),
    [token, user, setAuth, clearAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}