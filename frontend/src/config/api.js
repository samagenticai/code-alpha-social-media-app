/**
 * Public API base URL for the Pulse frontend.
 * Local (Vite): VITE_API_URL=/api → proxied to backend :5000
 * Vercel monorepo: VITE_API_URL=/api → same-origin rewrite to Express
 * Split deploy: VITE_API_URL=https://your-api.vercel.app/api
 */
export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export default API_URL;
