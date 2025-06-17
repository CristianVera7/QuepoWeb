import axios from 'axios';

// Verificar la URL que se está usando
console.log('API baseURL:', import.meta.env.VITE_API_URL);

// Configurar base URL automáticamente
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para agregar token si existe (opcional)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
