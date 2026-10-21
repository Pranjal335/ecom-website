import { create } from 'zustand';
import axiosClient from '../api/axiosClient';
import { useCartStore } from './useCartStore';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('accessToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: true,

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await axiosClient.get('/auth/me');
      const userData = res?.data || res;
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('accessToken');
      useCartStore.getState().clearCartState();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    const payload = res?.data || res;
    const token = payload.accessToken;

    if (token) {
      localStorage.setItem('accessToken', token);
    }

    set({ user: payload.user, token, isAuthenticated: true });
    return payload;
  },

  register: async (name, email, password, role = 'customer') => {
    const res = await axiosClient.post('/auth/register', { name, email, password, role });
    return res?.data || res;
  },

  logout: async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API call error:', err.message);
    } finally {
      localStorage.removeItem('accessToken');
      useCartStore.getState().clearCartState(); // Instantly wipes cart from memory
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));