import axiosClient from './axiosClient';

export const getCart = async () => {
  return await axiosClient.get('/cart');
};

export const addToCart = async (productId, quantity = 1) => {
  return await axiosClient.post('/cart', { productId, quantity });
};

export const updateCartItem = async (productId, quantity) => {
  return await axiosClient.put('/cart', { productId, quantity });
};

export const removeCartItem = async (productId) => {
  return await axiosClient.delete(`/cart/item/${productId}`);
};

export const applyCoupon = async (code) => {
  return await axiosClient.post('/cart/coupon', { code });
};

export const removeCoupon = async () => {
  return await axiosClient.delete('/cart/coupon');
};