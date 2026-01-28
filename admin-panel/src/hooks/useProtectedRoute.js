import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionContext';

/**
 * Hook for protected route logic
 * @param {Object} options - Route protection options
 * @param {string} options.resource - Required resource permission
 * @param {string} options.action - Required action permission
 * @param {string[]} options.roles - Required roles (alternative to permissions)
 * @param {boolean} options.redirect - Whether to redirect on failure (default: true)
 * @returns {Object} - { hasAccess, loading }
 */
export const useProtectedRoute = (options = {}) => {
  const { resource, action, roles, redirect = true } = options;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { hasPermission, hasAnyRole, loading: permLoading } = usePermissions();
  const navigate = useNavigate();

  const loading = authLoading || permLoading;

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      if (redirect) {
        navigate('/');
      }
      return;
    }

    // Check role-based access
    if (roles && roles.length > 0) {
      if (!hasAnyRole(roles)) {
        if (redirect) {
          navigate('/dashboard');
        }
        return;
      }
    }

    // Check permission-based access
    if (resource && action) {
      if (!hasPermission(resource, action)) {
        if (redirect) {
          navigate('/dashboard');
        }
        return;
      }
    }
  }, [isAuthenticated, loading, resource, action, roles, hasPermission, hasAnyRole, navigate, redirect]);

  const hasAccess = () => {
    if (!isAuthenticated) return false;

    // Check role-based access
    if (roles && roles.length > 0) {
      return hasAnyRole(roles);
    }

    // Check permission-based access
    if (resource && action) {
      return hasPermission(resource, action);
    }

    // If no restrictions, authenticated users have access
    return true;
  };

  return {
    hasAccess: hasAccess(),
    loading,
  };
};

