import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../../contexts/PermissionContext';
import { Spin } from 'antd';

/**
 * Component to handle parent-child route redirection logic:
 * - If parent has dedicated page route, it won't reach here (handled by specific routes)
 * - If parent doesn't have dedicated page, redirect to first child
 * - If single route doesn't exist, redirect to dashboard
 */
const ParentRouteRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { menuResources, resources } = usePermissions();

  useEffect(() => {
    const checkAndRedirect = () => {
      const currentPath = location.pathname;
      
      // Get all resources
      const allResources = menuResources || resources || [];
      
      if (allResources.length === 0) {
        // Resources not loaded yet, wait a bit
        return;
      }
      
      // Find resource matching current path (exact match)
      const currentResource = allResources.find(
        (resource) => resource.path === currentPath
      );

      if (!currentResource) {
        // No resource found for this path - redirect to dashboard
        navigate('/dashboard', { replace: true });
        return;
      }

      // Check if this resource has children (is a parent)
      // Handle both ObjectId and populated parentId formats
      const children = allResources.filter((resource) => {
        if (!resource.parentId) return false;
        
        const parentId = typeof resource.parentId === 'object' 
          ? (resource.parentId._id || resource.parentId)
          : resource.parentId;
        const currentId = currentResource._id || currentResource._id;
        
        return parentId && currentId && parentId.toString() === currentId.toString();
      });

      if (children.length > 0) {
        // This is a parent resource with children
        // Sort children by order and redirect to first child
        const sortedChildren = children.sort((a, b) => (a.order || 0) - (b.order || 0));
        const firstChildPath = sortedChildren[0].path;
        if (firstChildPath) {
          navigate(firstChildPath, { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        // Not a parent or no children - redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    };

    // Small delay to ensure resources are loaded
    const timer = setTimeout(() => {
      checkAndRedirect();
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname, menuResources, resources, navigate]);

  // Show loading while checking
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spin size="large" />
    </div>
  );
};

export default ParentRouteRedirect;

