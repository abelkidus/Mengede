/**
 * Centralized API service with base fetch wrapper.
 * Automatically retrieves the adminToken from localStorage and injects it
 * as a Bearer token into the Authorization header for outgoing requests.
 */

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

  const response = await fetch(endpoint, config);

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
    const message =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      (typeof data === 'string' && data) ||
      response.statusText ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Named domain API methods
export const fetchTerminals = () => apiFetch('/api/terminals');

export const submitRoute = (routeData) =>
  apiFetch('/api/routes', {
    method: 'POST',
    body: JSON.stringify(routeData),
  });

export const fetchPendingRoutes = () => apiFetch('/api/admin/pending');

export const updateRouteStatus = (routeId, status) =>
  apiFetch(`/api/admin/routes/${routeId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const adminLogin = (credentials) =>
  apiFetch('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const api = {
  fetch: apiFetch,
  fetchTerminals,
  submitRoute,
  fetchPendingRoutes,
  updateRouteStatus,
  adminLogin,
};

export default api;
