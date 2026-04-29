import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

const unwrap = (response) => response.data?.data ?? response.data;

export const extractError = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  'Request failed';

export const authAPI = {
  login: async (credentials) => unwrap(await api.post('/auth/login', credentials)),
  getCurrentUser: async () => unwrap(await api.get('/auth/me')),
};

export const movieAPI = {
  list: async (params) => unwrap(await api.get('/movies', { params })),
  detail: async (id) => unwrap(await api.get(`/movies/${id}`)),
  create: async (payload) => unwrap(await api.post('/movies', payload)),
  update: async (id, payload) => unwrap(await api.put(`/movies/${id}`, payload)),
  remove: async (id) => unwrap(await api.delete(`/movies/${id}`)),
};

export const cinemaAPI = {
  list: async () => unwrap(await api.get('/cinemas')),
  detail: async (id) => unwrap(await api.get(`/cinemas/${id}`)),
  create: async (payload) => unwrap(await api.post('/cinemas', payload)),
  update: async (id, payload) => unwrap(await api.put(`/cinemas/${id}`, payload)),
  remove: async (id) => unwrap(await api.delete(`/cinemas/${id}`)),
};

export const roomAPI = {
  list: async (params) => unwrap(await api.get('/rooms', { params })),
  detail: async (id) => unwrap(await api.get(`/rooms/${id}`)),
  create: async (payload) => unwrap(await api.post('/rooms', payload)),
  update: async (id, payload) => unwrap(await api.put(`/rooms/${id}`, payload)),
  remove: async (id) => unwrap(await api.delete(`/rooms/${id}`)),
};

export const seatAPI = {
  listByRoom: async (roomId, params) => unwrap(await api.get(`/seats/room/${roomId}`, { params })),
  generate: async (payload) => unwrap(await api.post('/seats', payload)),
  clearRoom: async (roomId) => unwrap(await api.delete(`/seats/room/${roomId}`)),
};

export const showtimeAPI = {
  list: async (params) => unwrap(await api.get('/showtimes', { params })),
  detail: async (id) => unwrap(await api.get(`/showtimes/${id}`)),
  create: async (payload) => unwrap(await api.post('/showtimes', payload)),
  update: async (id, payload) => unwrap(await api.put(`/showtimes/${id}`, payload)),
  remove: async (id) => unwrap(await api.delete(`/showtimes/${id}`)),
};

export const bookingAPI = {
  list: async (params) => unwrap(await api.get('/bookings', { params })),
  detail: async (id) => unwrap(await api.get(`/bookings/${id}`)),
  cancel: async (id) => unwrap(await api.post(`/bookings/${id}/cancel`)),
};

export default api;
