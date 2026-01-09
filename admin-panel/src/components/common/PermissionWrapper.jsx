import { usePermissions } from '../../contexts/PermissionContext';

/**
 * Permission Wrapper Component
 * Conditionally renders children based on user permissions
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.resource - Required resource permission
 * @param {string} props.action - Required action permission
 * @param {string[]} props.roles - Required roles (alternative to permissions)
 * @param {React.ReactNode} props.fallback - Component to render if permission denied (optional)
 * @param {boolean} props.showFallback - Whether to show fallback or hide completely (default: false)
 * @returns {React.ReactNode}
 */
const PermissionWrapper = ({
  children,
  resource,
  action,
  roles,
  fallback = null,
  showFallback = false,
}) => {
  const { hasPermission, hasAnyRole } = usePermissions();

  let hasAccess = false;

  // Check role-based access
  if (roles && roles.length > 0) {
    hasAccess = hasAnyRole(roles);
  }
  // Check permission-based access
  else if (resource && action) {
    hasAccess = hasPermission(resource, action);
  }
  // If no restrictions specified, show content
  else {
    hasAccess = true;
  }

  if (hasAccess) {
    return children;
  }

  if (showFallback) {
    return fallback;
  }

  return null;
};

export default PermissionWrapper;

