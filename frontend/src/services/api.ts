import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const httpErrorMessages: Record<number, string> = {
  400: 'Requête invalide',
  401: 'Session expirée. Veuillez vous reconnecter.',
  403: 'Accès refusé',
  404: 'Ressource introuvable',
  409: 'Conflit avec les données existantes',
  422: 'Données invalides',
  429: 'Trop de requêtes. Réessayez plus tard.',
  500: 'Erreur serveur. Veuillez réessayer plus tard.',
  502: 'Service temporairement indisponible',
  503: 'Service temporairement indisponible',
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url === '/auth/login';
      if (!isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    if (error.response && !error.response.data?.message) {
      const status = error.response.status;
      error.response.data = {
        ...error.response.data,
        message: httpErrorMessages[status] || 'Une erreur est survenue',
      };
    }

    return Promise.reject(error);
  },
);

export default api;
