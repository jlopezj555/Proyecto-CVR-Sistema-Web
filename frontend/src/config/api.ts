// Configuración de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    LOGIN: `${API_BASE_URL}/api/login`,
    REGISTER: `${API_BASE_URL}/api/register`,
    CONTACT: `${API_BASE_URL}/api/contact`,
    HEALTH: `${API_BASE_URL}/api/health`,
    // Agregar más endpoints según sea necesario
  }
};

export default API_CONFIG;
