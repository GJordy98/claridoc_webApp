// Client HTTP centralisé pour communiquer avec le backend Django
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/claridoc_token=([^;]+)/);
  return match ? match[1] : null;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const dataObj = await res.json().catch(() => ({ message: 'Erreur inconnue' }));
    const errorMessage = dataObj.error || dataObj.message || `Erreur ${res.status}`;
    throw new Error(errorMessage);
  }

  return res.json();
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const apiLogin = (email: string, password: string) =>
  apiFetch('/auth/login/', { method: 'POST', body: JSON.stringify({ username: email, password }) });

export const apiRegister = (data: {
  nom_societe: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  telephone: string;
  captcha_token?: string | null;
}) => apiFetch('/auth/register/', { method: 'POST', body: JSON.stringify(data) });

export const apiVerifyOTP = (email: string, code: string) =>
  apiFetch('/auth/verify-otp/', { method: 'POST', body: JSON.stringify({ email, code }) });

// ─── UTILISATEURS ─────────────────────────────────────────────────────────────
export const apiGetUsers = () => apiFetch('/users/');
export const apiToggleUser = (id: number) => apiFetch(`/users/${id}/toggle_active/`, { method: 'POST' });
export const apiChangePassword = (newPassword: string) =>
  apiFetch('/users/change_password/', { method: 'POST', body: JSON.stringify({ new_password: newPassword }) });

// ─── SUCCURSALES & LICENCES ─────────────────────────────────────────────────────
export const apiGetSuccursales = () => apiFetch('/succursales/');
export const apiGetLicences = () => apiFetch('/licences/');

// ─── CONFIG FTP ────────────────────────────────────────────────────────────────
export const apiGetConfig = (succursaleId?: number) =>
  apiFetch(`/config/${succursaleId ? `?succursale_id=${succursaleId}` : ''}`);
export const apiUpdateConfig = (data: object) =>
  apiFetch('/config/', { method: 'PUT', body: JSON.stringify(data) });

// ─── MACHINES ─────────────────────────────────────────────────────────────────
export const apiGetMachines = () => apiFetch('/machines/');
export const apiToggleMachine = (id: number) =>
  apiFetch(`/machines/${id}/toggle_active/`, { method: 'POST' });

// ─── PAIEMENTS ────────────────────────────────────────────────────────────────
export const apiGetPayments = () => apiFetch('/payments/');
export const apiSubmitPayment = (data: FormData) => {
  const token = typeof document !== 'undefined'
    ? (document.cookie.match(/claridoc_token=([^;]+)/)?.[1] ?? null)
    : null;
  return fetch(`${API_BASE}/payments/`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: data,
  }).then(async res => {
    if (!res.ok) {
      const errObj = await res.json().catch(() => ({ message: 'Erreur inconnue' }));
      const msg = errObj.error || errObj.message || `Erreur ${res.status}`;
      throw new Error(msg);
    }
    return res.json();
  });
};

export const apiInitiateSteevePay = (
  paymentRequestId: number,
  telephone: string,
  providerId: number
) =>
  apiFetch('/pay/initiate/', {
    method: 'POST',
    body: JSON.stringify({
      payment_request_id: paymentRequestId,
      telephone,
      provider_id: providerId,
    }),
  });

export const apiCheckPaymentStatus = (hubReference: string) =>
  apiFetch(`/pay/status/${hubReference}/`);

export const apiValidatePayment = (
  id: number,
  action: 'accept' | 'reject',
  licenceData?: { max_machines: number; date_fin: string; montant?: number }
) =>
  apiFetch(`/payments/${id}/validate/`, {
    method: 'POST',
    body: JSON.stringify({ action, ...licenceData }),
  });

// ─── ADMIN (SuperAdmin) ────────────────────────────────────────────────────────
export const apiGetClients = () => apiFetch('/clients/');
export const apiGetClientDetail = (id: number) => apiFetch(`/clients/${id}/`);
export const apiGetClientSuccursales = (clientId: number) => apiFetch(`/succursales/?client_id=${clientId}`);
export const apiGetClientLicences = (clientId: number) => apiFetch(`/licences/?client_id=${clientId}`);
export const apiGetClientUsers = (clientId: number) => apiFetch(`/users/?client_id=${clientId}`);
export const apiGetLogs = (params?: { userId?: number; action?: string; clientId?: number; dateFrom?: string; dateTo?: string }) => {
  const qs = new URLSearchParams();
  if (params?.userId)   qs.set('user_id', String(params.userId));
  if (params?.action)   qs.set('action', params.action);
  if (params?.clientId) qs.set('client_id', String(params.clientId));
  if (params?.dateFrom) qs.set('date_from', params.dateFrom);
  if (params?.dateTo)   qs.set('date_to', params.dateTo);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/logs/${query}`);
};
export const apiGetFichiers = (userId?: number) => apiFetch(`/fichiers/${userId ? `?user_id=${userId}` : ''}`);
export const apiGetUsageStats = () => apiFetch('/clients/usage_stats/');
export const apiGetActionStats = () => apiFetch('/logs/action_stats/');

// ─── VISITEURS ─────────────────────────────────────────────────────────────────
/** Récupère la liste des visiteurs. statut = 'PRESENT' | 'PARTI' | undefined (tous) */
export const apiGetVisiteurs = (statut?: 'PRESENT' | 'PARTI') =>
  apiFetch(`/visiteurs/${statut ? `?statut=${statut}` : ''}`);

/** Enregistre la sortie d'un visiteur */
export const apiVisiteurSortie = (id: number) =>
  apiFetch(`/visiteurs/${id}/sortie/`, { method: 'POST' });
