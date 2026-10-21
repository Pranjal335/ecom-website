import axiosClient from './axiosClient';

export const createOrder = async (orderData) => {
  return await axiosClient.post('/orders', orderData);
};

export const getMyOrders = async () => {
  return await axiosClient.get('/orders');
};

export const getOrderById = async (orderId) => {
  return await axiosClient.get(`/orders/${orderId}`);
};

export const cancelOrder = async (orderId) => {
  return await axiosClient.put(`/orders/${orderId}/cancel`);
};

// Payment gateway helpers
export const createRazorpayOrder = async (orderId) => {
  return await axiosClient.post('/payments/create-order', { orderId });
};

export const verifyPaymentSignature = async (paymentData) => {
  return await axiosClient.post('/payments/verify', paymentData);
};