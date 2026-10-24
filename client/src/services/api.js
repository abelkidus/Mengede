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
    // If an authenticated admin request returns 401 or 403 (excluding /api/admin/login),
    // automatically clear the adminToken and redirect to /admin/login
    const isLoginEndpoint = typeof endpoint === 'string' && endpoint.includes('/api/admin/login');
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
