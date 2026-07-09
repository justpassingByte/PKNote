// Centralized API configuration
// All API calls should use this base URL instead of hardcoding localhost

const IS_SERVER = typeof window === 'undefined';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (IS_SERVER ? 'http://backend:3001' : '');

export const API = {
  base: API_BASE_URL,
  players: `${API_BASE_URL}/api/players`,
  dashboard: `${API_BASE_URL}/api/dashboard`,
  notes: `${API_BASE_URL}/api/notes`,
  templates: `${API_BASE_URL}/api/templates`,
  platforms: `${API_BASE_URL}/api/platforms`,
  settings: `${API_BASE_URL}/api/settings`,

  // Dynamic paths
  player: (id: string) => `${API_BASE_URL}/api/players/${id}`,
  note: (id: string) => `${API_BASE_URL}/api/notes/${id}`,
  template: (id: string) => `${API_BASE_URL}/api/templates/${id}`,
  platform: (id: string) => `${API_BASE_URL}/api/platforms/${id}`,
  playerStats: (playerId: string) => `${API_BASE_URL}/api/players/${playerId}/stats`,
  playerProfile: (playerId: string) => `${API_BASE_URL}/api/players/${playerId}/profile`,
  practiceFocuses: (playerId: string) => `${API_BASE_URL}/api/players/${playerId}/practice/focuses`,
  practiceNext: (playerId: string, focusId: string) => `${API_BASE_URL}/api/players/${playerId}/practice/next?focusId=${focusId}`,
  practiceEvaluate: (playerId: string) => `${API_BASE_URL}/api/players/${playerId}/practice/evaluate`,
  playerExport: `${API_BASE_URL}/api/players/export`,
  playerBulk: `${API_BASE_URL}/api/players/bulk`,
  refreshProfile: `${API_BASE_URL}/api/players/profile/refresh`,
  usage: `${API_BASE_URL}/api/usage`,
  ocrTemplates: `${API_BASE_URL}/api/ocr/templates`,
  ocrTemplateImage: (type: string, filename: string) => `${API_BASE_URL}/api/ocr/templates/${type}/${filename}`,
  ocrTemplateDelete: (type: string, filename: string) => `${API_BASE_URL}/api/ocr/templates/${type}/${filename}`,
  ocrFailedCases: `${API_BASE_URL}/api/ocr/failed-cases`,
  ocrFailedCaseLabel: `${API_BASE_URL}/api/ocr/failed-cases/label`,
  ocrFailedCaseImage: (subfolder: string, filename: string) => `${API_BASE_URL}/api/ocr/templates_failed/${subfolder}/${filename}`,

  // Hand Analysis
  hands: `${API_BASE_URL}/api/hands`,
  handAnalyze: `${API_BASE_URL}/api/hands/analyze`,
  handHistory: `${API_BASE_URL}/api/hands/history`,
  hand: (id: string) => `${API_BASE_URL}/api/hands/${id}`,

  // Sessions
  sessions: `${API_BASE_URL}/api/sessions`,
  sessionRegister: `${API_BASE_URL}/api/sessions/register`,
  sessionForceLogout: `${API_BASE_URL}/api/sessions/force-logout`,
  sessionLogoutAll: `${API_BASE_URL}/api/sessions/logout-all`,

  // Payments
  payments: `${API_BASE_URL}/api/payments`,
  paymentCreateInvoice: `${API_BASE_URL}/api/payments/create-invoice`,
  paymentStatus: (id: string) => `${API_BASE_URL}/api/payments/${id}/status`,
  pricingPublic: `${API_BASE_URL}/api/admin/pricing/public`,
  authRefreshSession: `${API_BASE_URL}/api/auth/refresh-session`,

  // API Keys
  apiKeys: `${API_BASE_URL}/api/api-keys`,
  apiKey: (id: string) => `${API_BASE_URL}/api/api-keys/${id}`,
  apiKeyPermanent: (id: string) => `${API_BASE_URL}/api/api-keys/${id}/permanent`,
  apiKeyDevices: (id: string, deviceId: string) => `${API_BASE_URL}/api/api-keys/${id}/devices/${deviceId}`,
} as const;

/**
 * Global fetch wrapper â€” always sends cookies (credentials: 'include')
 * so the auth token cookie reaches the backend on every request.
 * Use this instead of raw fetch() for all API calls.
 */
export function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

/** POST helper */
export function apiPost(url: string, body: unknown, init: RequestInit = {}): Promise<Response> {
  return apiFetch(url, { ...init, method: 'POST', body: JSON.stringify(body) });
}

/** DELETE helper */
export function apiDelete(url: string, init: RequestInit = {}): Promise<Response> {
  return apiFetch(url, { ...init, method: 'DELETE' });
}

/** GET helper (credentials included) */
export function apiGet(url: string, init: RequestInit = {}): Promise<Response> {
  return apiFetch(url, { ...init, method: 'GET' });
}


