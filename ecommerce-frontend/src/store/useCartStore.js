import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

export const useCartStore = create((set) => ({
  cart: null,
  totalItems: 0,
  isLoading: false,

  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const res = await axiosClient.get('/cart');
      const cartData = res.data;
      const count = cartData.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
      set({ cart: cartData, totalItems: count, isLoading: false });
    } catch {
      set({ cart: null, totalItems: 0, isLoading: false });
    }
  },

  addToCart: async (productId, quantity = 1) => {
    const res = await axiosClient.post('/cart', { productId, quantity });
    const cartData = res.data;
    const count = cartData.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
    set({ cart: cartData, totalItems: count });
    return cartData;
  },

  updateQuantity: async (productId, quantity) => {
    const res = await axiosClient.put('/cart', { productId, quantity });
    const cartData = res.data;
    const count = cartData.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
    set({ cart: cartData, totalItems: count });
    return cartData;
  },

  removeItem: async (productId) => {
    const res = await axiosClient.delete(`/cart/item/${productId}`);
    const cartData = res.data;
    const count = cartData.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
    set({ cart: cartData, totalItems: count });
    return cartData;
  },

  clearCartState: () => set({ cart: null, totalItems: 0 }),
}));