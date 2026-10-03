export const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
export type Role = 'ADMIN' | 'MANAGER' | 'STOREKEEPER' | 'BRANCH_USER';
export type User = { sub: string; username: string; role: Role; locationId: string | null };

export async function api(path: string, token: string, opts: RequestInit = {}) {
  const r = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    throw new Error(message || `Request failed (${r.status})`);
  }
  return data;
}

export function money(v: unknown) {
  return Number(v || 0).toLocaleString('en-RW', { maximumFractionDigits: 2 });
}

export function when(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}
