import axios, { AxiosError } from 'axios';

// Detectar automáticamente la URL del backend basándose en la URL actual del frontend
export const getApiUrl = () => {
  const hostname = window.location.hostname;

  // Si estamos usando localtunnel, usar la URL del backend en localtunnel
  if (hostname.includes('loca.lt')) {
    return 'https://miguel-airbnb-backend-v2.loca.lt';
  }

  // Si estamos en una IP de red (no localhost), siempre usar esa IP para el backend
  // Esto asegura que funcione cuando se accede desde otros dispositivos en la red
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3000`;
  }

  // Si estamos en localhost, usar la variable de entorno o localhost por defecto
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  return 'http://localhost:3000';
};

const API_URL = getApiUrl();

// Log para debug (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🔗 API URL configurada:', API_URL);
  console.log('🌐 Frontend URL:', window.location.origin);
}

// Tiempo de expiración de sesión: 15 minutos (900000 ms)
const SESSION_TIMEOUT = 15 * 60 * 1000;

// Timestamp de la última actividad
let lastActivityTime = Date.now();

// Timer para cerrar sesión automáticamente
let inactivityTimer: NodeJS.Timeout | null = null;

// Función para resetear el timer de inactividad
const resetInactivityTimer = () => {
  lastActivityTime = Date.now();

  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }

  inactivityTimer = setTimeout(() => {
    // Cerrar sesión después de 15 minutos de inactividad
    const token = localStorage.getItem('token');
    if (token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }, SESSION_TIMEOUT);
};

// Función para actualizar la última actividad
const updateActivity = () => {
  resetInactivityTimer();
};

// Event listeners para detectar actividad del usuario
if (typeof window !== 'undefined') {
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach((event) => {
    document.addEventListener(event, updateActivity, true);
  });
}

// Crear instancia de Axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor de request: Agregar token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Header de impersonación para SuperAdmin
    const impersonatedResidenceId = localStorage.getItem('impersonatedResidenceId');
    if (impersonatedResidenceId && config.headers) {
      config.headers['x-impersonate-residence-id'] = impersonatedResidenceId;
    }

    // Header de contexto de residencia (para Admin/Owner multi-residencia)
    const storedManagedResidence = localStorage.getItem('managedResidence');
    if (storedManagedResidence && config.headers) {
      try {
        const managedResidence = JSON.parse(storedManagedResidence);
        if (managedResidence && managedResidence.id) {
          config.headers['x-residence-context'] = managedResidence.id;
        }
      } catch (e) {
        // Ignorar error de parseo
      }
    }

    // Actualizar actividad en cada request
    updateActivity();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response: Manejar errores y refresh token
apiClient.interceptors.response.use(
  (response) => {
    // Actualizar actividad en cada response exitosa
    updateActivity();
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as { _retry?: boolean } | undefined;

    // Si el error es 401 (no autorizado) y no es un reintento
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      // Limpiar tokens y redirigir a login
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Solo redirigir si no estamos ya en la página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Si el error es 403 (prohibido)
    if (error.response?.status === 403) {
      // Opcional: mostrar mensaje de permisos insuficientes
      console.error('Acceso denegado: Permisos insuficientes');
    }

    return Promise.reject(error);
  }
);

// Inicializar el timer al cargar
if (typeof window !== 'undefined') {
  resetInactivityTimer();
}

export default apiClient;

