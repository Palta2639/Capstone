import axios from 'axios';

// Deteccion dinamica para evitar bloqueos por discrepancia localhost vs 127.0.0.1
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:8000`;
  }
  return 'http://localhost:8000';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor: Sincroniza baseURL del host del navegador y agrega token si existe
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      if (!process.env.NEXT_PUBLIC_API_URL) {
        config.baseURL = `http://${window.location.hostname || 'localhost'}:8000`;
      }
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta: Manejo de sesión expirada (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-change'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// --- SERVICIOS DE PRODUCTOS ---
export const productService = {
  getAll: async (params = {}) => {
    const response = await api.get('/productos/', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/productos/${id}`);
    return response.data;
  },
  
  create: async (productoData) => {
    const response = await api.post('/productos/', productoData);
    return response.data;
  },
  
  update: async (id, productoData) => {
    const response = await api.put(`/productos/${id}`, productoData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/productos/${id}`);
    return response.data;
  },
};

// --- SERVICIOS DE CATEGORÍAS ---
export const categoryService = {
  getAll: async () => {
    const response = await api.get('/categorias/');
    return response.data;
  },
};

// --- SERVICIOS DE AUTENTICACIÓN ---
export const authService = {
  login: async (email, password) => {
    // FastAPI expects form-data for standard OAuth2 but we configured it to accept JSON in login (schemas.UsuarioLogin)
    const response = await api.post('/login/', { email, password });
    return response.data; // Retorna { access_token, token_type }
  },
  
  register: async (userData) => {
    const response = await api.post('/usuarios/', userData);
    return response.data;
  }
};

// --- SERVICIOS DE COTIZACIONES ---
export const cotizacionService = {
  // Dimensionamiento preliminar y almacenamiento en backend
  solicitarCotizacionIA: async (payload) => {
    const response = await api.post('/cotizaciones/ia', payload);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/cotizaciones/');
    return response.data;
  },

  updateEstado: async (id, nuevoEstado) => {
    const response = await api.put(`/cotizaciones/${id}?nuevo_estado=${nuevoEstado}`);
    return response.data;
  }
};

// --- SERVICIOS DE PEDIDOS Y ESTADÍSTICAS DEL DASHBOARD ---
export const orderService = {
  getAll: async () => {
    const response = await api.get('/pedidos/');
    return response.data;
  },

  getMyOrders: async () => {
    const response = await api.get('/pedidos/mis-pedidos');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/pedidos/stats');
    return response.data;
  },

  create: async (pedidoData) => {
    const response = await api.post('/pedidos/', pedidoData);
    return response.data;
  }
};

// --- SERVICIOS DE USUARIO Y PERFIL ---
export const userService = {
  getProfile: async () => {
    const response = await api.get('/usuarios/me');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/usuarios/me', userData);
    return response.data;
  }
};

// --- SERVICIO DE ASISTENTE IA SOLAR ---
export const iaService = {
  chat: async (message, history = []) => {
    const response = await api.post('/ia/chat', { message, history });
    return response.data;
  }
};




