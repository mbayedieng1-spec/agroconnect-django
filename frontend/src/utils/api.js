import axios from 'axios';

// En dev avec `npm run dev` : proxy Vite vers :8000
// En preview/prod : pointer directement vers le backend
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agroconnect_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
