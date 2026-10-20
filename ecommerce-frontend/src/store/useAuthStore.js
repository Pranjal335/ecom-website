import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await axiosClient.get('/auth/me');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    set({ user: res.data.user, isAuthenticated: true });
    return res.data;
  },

  register: async (name, email, password, role = 'customer') => {
    const res = await axiosClient.post('/auth/register', { name, email, password, role });
    return res.data;
  },

  logout: async () => {
    try {
      await axiosClient.post('/auth/logout');
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },
}));