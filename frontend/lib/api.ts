import axios from 'axios';

export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

// ---- sessão em localStorage ----
export const session = {
  get access() { return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null; },
  get refresh() { return typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null; },
  get user() {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },
  save(data: { accessToken: string; refreshToken: string; user: unknown }) {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  },
  clear() {
    ['accessToken', 'refreshToken', 'user'].forEach((k) => localStorage.removeItem(k));
  },
};

api.interceptors.request.use((config) => {
  const token = session.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- refresh automático em 401 (uma tentativa, com fila) ----
let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && session.refresh) {
      original._retry = true;
      refreshing ??= axios
        .post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, { refreshToken: session.refresh })
        .then(({ data }) => { session.save(data); return data.accessToken as string; })
        .catch((e) => { session.clear(); window.location.href = '/login'; throw e; })
        .finally(() => { refreshing = null; });
      const token = await refreshing;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    }
    return Promise.reject(error);
  },
);
