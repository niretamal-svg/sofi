import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('sofi_token') || '',
  user: JSON.parse(localStorage.getItem('sofi_user') || 'null'),
  setAuth: (token, user) => {
    localStorage.setItem('sofi_token', token);
    localStorage.setItem('sofi_user', JSON.stringify(user));
    set({ token, user });
  },
  clearAuth: () => {
    localStorage.removeItem('sofi_token');
    localStorage.removeItem('sofi_user');
    set({ token: '', user: null });
  }
}));
