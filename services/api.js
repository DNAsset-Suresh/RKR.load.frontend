/**
 * The single door to the Express API.
 *
 * Every business figure in this app arrives through here. The frontend never
 * computes money for storage - it only renders what the backend calculated.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://backend-vd3v.onrender.com/api';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      cache: 'no-store',
    });
  } catch (networkError) {
    // fetch only rejects when the server is unreachable.
    throw new ApiError(
      'Cannot reach the server. Check that the API is running on ' + BASE + '.',
      0
    );
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = payload?.error?.message || `Request failed (${res.status}).`;
    throw new ApiError(message, res.status, payload?.error?.details);
  }
  return payload;
}

/** Binary endpoints (Excel, PDF) return a Blob, not JSON. */
async function download(path, fallbackName) {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const payload = isJson ? await res.json().catch(() => null) : null;
    throw new ApiError(payload?.error?.message || 'Download failed.', res.status);
  }
  const blob = await res.blob();

  const disposition = res.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match ? match[1] : fallbackName;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return filename;
}

export const api = {
  transactions: {
    list: (params) => request(`/transactions${buildQuery(params)}`),
    get: (id) => request(`/transactions/${id}`),
    create: (body) => request('/transactions', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),
    preview: (weightKg) => request('/transactions/preview', {
      method: 'POST', body: JSON.stringify({ weightKg }),
    }),
  },
  dashboard: {
    get: (params) => request(`/dashboard${buildQuery(params)}`),
  },
  reports: {
    daily: (params) => request(`/reports/daily${buildQuery(params)}`),
    weekly: (params) => request(`/reports/weekly${buildQuery(params)}`),
    monthly: (params) => request(`/reports/monthly${buildQuery(params)}`),
    overall: (params) => request(`/reports/overall${buildQuery(params)}`),
    vehicles: (params) => request(`/reports/vehicles${buildQuery(params)}`),
  },
  invoices: {
    list: (params) => request(`/invoices${buildQuery(params)}`),
    get: (id) => request(`/invoices/${id}`),
    preview: (weekOf) => request(`/invoices/preview${buildQuery({ weekOf })}`),
    generate: (weekOf, regenerate = false) => request('/invoices/weekly', {
      method: 'POST', body: JSON.stringify({ weekOf, regenerate }),
    }),
    pdfUrl: (id) => `${BASE}/invoices/${id}/pdf?inline=true`,
    downloadPdf: (id, number) => download(`/invoices/${id}/pdf`, `${number || 'invoice'}.pdf`),
    downloadExcel: (id, number) => download(`/invoices/${id}/excel`, `${number || 'invoice'}.xlsx`),
  },
  exports: {
    excel: (params) => download(`/export/excel${buildQuery(params)}`, 'RKR-Transactions.xlsx'),
  },
  settings: {
    get: () => request('/settings'),
    update: (body) => request('/settings', { method: 'PUT', body: JSON.stringify(body) }),
  },
  health: () => request('/health'),
};

export default api;
