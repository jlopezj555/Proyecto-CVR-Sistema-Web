// src/config/api.ts
function normalizeBaseUrl(raw?: string) {
  const v = (raw || '').trim();
  if (!v) return '';
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  return withProto.replace(/\/+$/, '');
}

const BASE = normalizeBaseUrl(import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_GET ?? '');

export const API_CONFIG = {
  BASE_URL: BASE,
  ENDPOINTS: {
    LOGIN: BASE ? `${BASE}/api/login` : '/api/login',
    REGISTER: BASE ? `${BASE}/api/register` : '/api/register',
    CONTACT: BASE ? `${BASE}/api/contact` : '/api/contact',
    HEALTH: BASE ? `${BASE}/api/health` : '/api/health',
  }
};

export default API_CONFIG;
