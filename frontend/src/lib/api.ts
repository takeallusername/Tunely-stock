import type { Company, SearchCompany } from './types';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '');

const LOCAL_TOKEN_KEY = 'tunely_user_token';

function issueSessionToken(): string {
  return globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;
}

export function getSessionToken(): string {
  if (typeof window === 'undefined') return '';

  const stored = window.localStorage.getItem(LOCAL_TOKEN_KEY);
  if (stored) return stored;

  const created = issueSessionToken();
  window.localStorage.setItem(LOCAL_TOKEN_KEY, created);
  return created;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const sessionToken = getSessionToken();
  if (!sessionToken) throw new Error('세션이 준비되지 않았습니다.');

  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('x-user-id', sessionToken);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: 'no-store' });
  const ct = res.headers.get('content-type') ?? '';
  const payload = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = typeof payload === 'string' ? payload : payload?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return payload as T;
}

export const api = {
  searchCompanies: (name: string) =>
    request<SearchCompany[]>(`/companies/search?name=${encodeURIComponent(name)}`),

  getCompanies: () =>
    request<Company[]>('/companies'),

  getCompany: (id: number) =>
    request<Company>(`/companies/${id}`),

  registerCompany: (data: { corpCode: string; corpName: string; stockCode?: string }) =>
    request<Company>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteCompany: (id: number) =>
    request<{ deleted: boolean }>(`/companies/${id}`, { method: 'DELETE' }),

  collectData: (id: number) =>
    request<{ financial: boolean; stock: boolean; history: boolean }>(
      `/companies/${id}/collect`,
      { method: 'POST' }
    ),
};
