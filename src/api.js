// API base URL:
//  • VITE_API_URL (if set, e.g. in Vercel) always wins.
//  • Production build (vite build) → the Sales Portal API on Render.
//  • Dev (npm run dev) → empty, so requests go through the Vite proxy to localhost:5100.
const PROD_API_URL = 'https://backend-xu2k.onrender.com';
const BASE = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_API_URL : '')).replace(/\/$/, '');
const TOKEN_KEY = 'sp_token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t, remember = true) => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    if (t) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, t);
  } catch { /* ignore */ }
};
export const replaceToken = (t) => {
  try { setToken(t, !!localStorage.getItem(TOKEN_KEY) || !sessionStorage.getItem(TOKEN_KEY)); } catch { /* ignore */ }
};

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(`${BASE}/api${path}`, { method, headers, body: payload });
  if (res.status === 401 && token) {
    setToken(null);
    window.dispatchEvent(new Event('sp-logout'));
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const qs = (o) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const attachmentUrl = (handoverId, fileId, download) =>
  `${BASE}/api/handovers/${handoverId}/attachments/${fileId}?token=${encodeURIComponent(getToken() || '')}${download ? '&download=1' : ''}`;

export async function downloadFile(path, filename) {
  const res = await fetch(`${BASE}/api${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const fmtDate = (d) => (d ? d.slice(0, 10).split('-').reverse().join('-') : '—');
export const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
export const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return fmtDateTime(iso);
};
export const fileKB = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
