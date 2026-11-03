import axios from 'axios';
import { BASE_URL } from './constants';

const api = axios.create({ baseURL: `${BASE_URL}/api/` });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});
export const messageFromError = (error) => {
  const data = error.response?.data;
  if (!data) return 'Unable to contact the server.';
  if (typeof data === 'string') return data;
  return data.error || data.detail || Object.entries(data).map(([k,v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ');
};
export default api;
