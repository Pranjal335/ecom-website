import axiosClient from './axiosClient';

export const getProducts = async (params = {}) => {
  return await axiosClient.get('/products', { params });
};

export const getProductById = async (idOrSlug) => {
  return await axiosClient.get(`/products/${idOrSlug}`);
};

export const getCategories = async () => {
  return await axiosClient.get('/categories');
};