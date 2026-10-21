import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return axiosClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.dispatchEvent(new Event('auth:session-expired'));
        return Promise.reject(refreshError);
      }
    }

    const customError = {
      message: error.response?.data?.message || 'Something went wrong',
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors || [],
    };

    return Promise.reject(customError);
  }
);

export default axiosClient;