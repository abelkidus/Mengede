/**
 * Centralized API service with base fetch wrapper.
 * Automatically retrieves the adminToken from localStorage and injects it
 * as a Bearer token into the Authorization header for outgoing requests.
 */

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
export const BASE_URL = API_BASE_URL;

export async function apiFetch(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  // Build target URL respecting dynamic API_BASE_URL
  let url;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    url = endpoint;
  } else {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (API_BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
      url = `${API_BASE_URL}${cleanEndpoint.slice(4)}`;
    } else {
      url = `${API_BASE_URL}${cleanEndpoint}`;
    }
  }

  const response = await fetch(url, config);

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    // If an authenticated admin request returns 401 or 403 (excluding /admin/login),
    // automatically clear the adminToken and redirect to /admin/login
    const isLoginEndpoint =
      typeof url === 'string' &&
      (url.includes('/admin/login') || url.includes('/api/admin/login'));
    if ((response.status === 401 || response.status === 403) && !isLoginEndpoint) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      }
    }

    let message =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      (typeof data === 'string' && data) ||
      response.statusText ||
      `Request failed with status ${response.status}`;

    // Surface field validation messages for 400 Bad Request if available
    if (response.status === 400 && data && typeof data === 'object') {
      const fieldErrorsObj = data.fieldErrors || data.details;
      if (fieldErrorsObj && typeof fieldErrorsObj === 'object') {
        const errorList = Object.entries(fieldErrorsObj)
          .map(([field, msgs]) => (Array.isArray(msgs) ? msgs.join(', ') : msgs))
          .filter(Boolean);
        if (errorList.length > 0) {
          message = errorList.join('. ');
        }
      } else if (Array.isArray(data.errors) && data.errors.length > 0) {
        message = data.errors.map((e) => e.message || e).join('. ');
      }
    }

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Named domain API methods
export const fetchTerminals = () => apiFetch(`${API_BASE_URL}/terminals`);

export const submitRoute = (routeData) =>
  apiFetch(`${API_BASE_URL}/routes`, {
    method: 'POST',
    body: JSON.stringify(routeData),
  });

export const fetchPendingRoutes = () => apiFetch(`${API_BASE_URL}/admin/pending`);

export const updateRouteStatus = (routeId, statusOrPayload, extraData = {}) => {
  const body =
    typeof statusOrPayload === 'object' && statusOrPayload !== null
      ? statusOrPayload
      : { status: statusOrPayload, ...extraData };

  return apiFetch(`${API_BASE_URL}/admin/routes/${routeId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
};

export const adminLogin = (credentials) =>
  apiFetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const createTerminal = (terminalData) =>
  apiFetch(`${API_BASE_URL}/admin/terminals`, {
    method: 'POST',
    body: JSON.stringify(terminalData),
  });

export const updateTerminal = (terminalId, terminalData) =>
  apiFetch(`${API_BASE_URL}/admin/terminals/${terminalId}`, {
    method: 'PATCH',
    body: JSON.stringify(terminalData),
  });

export const deleteTerminal = (terminalId) =>
  apiFetch(`${API_BASE_URL}/admin/terminals/${terminalId}`, {
    method: 'DELETE',
  });

export const updateTerminalRoutes = (terminalId, routes) =>
  apiFetch(`${API_BASE_URL}/terminals/${terminalId}/routes`, {
    method: 'PUT',
    body: JSON.stringify(Array.isArray(routes) ? { routes } : routes),
  });

export const bulkUpdateRouteStatus = (ids, status) =>
  apiFetch(`${API_BASE_URL}/admin/routes/bulk`, {
    method: 'PATCH',
    body: JSON.stringify({ ids, status }),
  });

export const fetchActionHistory = () => apiFetch(`${API_BASE_URL}/admin/history`);

export const api = {
  fetch: apiFetch,
  API_BASE_URL,
  BASE_URL,
  fetchTerminals,
  submitRoute,
  fetchPendingRoutes,
  fetchActionHistory,
  updateRouteStatus,
  updateTerminalRoutes,
  bulkUpdateRouteStatus,
  adminLogin,
  createTerminal,
  updateTerminal,
  deleteTerminal,
};

export default api;
