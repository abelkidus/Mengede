import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute wrapper component.
 * Verifies that the adminToken exists in localStorage.
 * If missing, redirects to /admin/login; otherwise renders children or <Outlet />.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('adminToken') || localStorage.getItem('token'))
    : null;

  if (!token) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
