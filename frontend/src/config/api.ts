// Configuración de la API
// Preferimos VITE_API_URL, si no existe, aceptamos VITE_API_GET (tu variable personalizada),
// y finalmente fallback a path relativo para que el frontend haga requests al mismo host
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_GET || '';

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
