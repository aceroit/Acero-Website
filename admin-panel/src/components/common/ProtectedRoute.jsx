import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../contexts/PermissionContext';

/**
 * Protected Route Component
 * Wraps routes that require authentication and optionally specific permissions
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.resource - Required resource permission (optional)
 * @param {string} props.action - Required action permission (optional)
 * @param {string[]} props.roles - Required roles (optional, alternative to permissions)
 * @param {string} props.redirectTo - Redirect path if access denied (default: '/')
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({
  children,
  resource,
  action,
  roles,
  redirectTo = '/',
}) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { hasPermission, hasAnyRole, loading: permLoading } = usePermissions();

  // Show loading state
  if (authLoading || permLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check role-based access
  if (roles && roles.length > 0) {
    if (!hasAnyRole(roles)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check permission-based access
  if (resource && action) {
    if (!hasPermission(resource, action)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

