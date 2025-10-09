function normalizeBaseUrl(raw?: string) {
  const v = (raw || '').trim();
  if (!v) return '';
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  return withProto.replace(/\/+$/, '');
}
const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_GET);
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    LOGIN: API_BASE_URL ? `${API_BASE_URL}/api/login` : '/api/login',
    REGISTER: API_BASE_URL ? `${API_BASE_URL}/api/register` : '/api/register',
    CONTACT: API_BASE_URL ? `${API_BASE_URL}/api/contact` : '/api/contact',
    HEALTH: API_BASE_URL ? `${API_BASE_URL}/api/health` : '/api/health',
  }
};
export default API_CONFIG;
