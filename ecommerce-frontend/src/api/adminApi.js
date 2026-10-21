import axiosClient from './axiosClient';

// Product Management
export const createSellerProduct = async (productData) => {
  return await axiosClient.post('/products', productData);
};

export const updateProductDetails = async (productId, updateData) => {
  return await axiosClient.put(`/products/${productId}`, updateData);
};

// Order Management
export const updateOrderStatusApi = async (orderId, orderStatus) => {
  return await axiosClient.patch(`/orders/${orderId}/status`, { orderStatus });
};