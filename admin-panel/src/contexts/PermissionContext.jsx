import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as permissionService from '../services/permissionService';
import * as resourceService from '../services/resourceService';
import { STORAGE_KEYS } from '../utils/constants';
import { checkPermission as checkPermissionHelper } from '../utils/permissionHelpers';

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [resources, setResources] = useState([]);
  const [menuResources, setMenuResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Fetch permissions and resources when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPermissions();
      fetchResources();
    } else {
      setPermissions([]);
      setResources([]);
      setMenuResources([]);
    }
  }, [isAuthenticated, user]);

  // Fetch permissions from API
  const fetchPermissions = useCallback(async () => {
    if (!user?.role) {
      setPermissions([]);
      return;
    }

    try {
      setLoading(true);
      
      // Try to get permissions from localStorage first (for quick initial render)
      const storedPermissions = localStorage.getItem(STORAGE_KEYS.PERMISSIONS);
      if (storedPermissions) {
        try {
          const parsed = JSON.parse(storedPermissions);
          setPermissions(parsed);
        } catch (e) {
          // Invalid stored data, ignore
        }
      }

      // Fetch fresh permissions from API using /permissions/me endpoint
      // This endpoint works for all authenticated users
      const response = await permissionService.getMyPermissions();
      
      if (response.success && response.data) {
        const { role, hasAllPermissions, permissions: apiPermissions } = response.data;
        
        // For super_admin, hasAllPermissions is true and permissions array is empty
        // We'll handle this in hasPermission check
        if (hasAllPermissions) {
          // Super admin - store empty array (will be handled in hasPermission)
          setPermissions([]);
          localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify([]));
        } else {
          // For other roles, transform the permissions array to match expected format
          // Backend returns: [{ resource, actions, conditions }]
          // Frontend expects: [{ role, resource, actions, conditions, isActive }]
          const formattedPermissions = Array.isArray(apiPermissions)
            ? apiPermissions.map(perm => ({
                role,
                resource: perm.resource,
                actions: perm.actions || [],
                conditions: perm.conditions || {},
                isActive: true
              }))
            : [];

          setPermissions(formattedPermissions);
          localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(formattedPermissions));
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // If API call fails, try to use stored permissions
      // If no stored permissions, clear the array
      const storedPermissions = localStorage.getItem(STORAGE_KEYS.PERMISSIONS);
      if (!storedPermissions) {
        setPermissions([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if user has a specific permission (synchronous - uses cached permissions)
  const hasPermission = useCallback(
    (resource, action) => {
      if (!isAuthenticated || !user) {
        return false;
      }

      // Super admin has all permissions
      // Note: For super_admin, permissions array is empty but hasAllPermissions flag indicates all access
      if (user.role === 'super_admin') {
        return true;
      }

      // For other roles, check against loaded permissions
      return checkPermissionHelper(permissions, resource, action);
    },
    [permissions, user, isAuthenticated]
  );

  // Server-side permission check (async - calls API)
  const checkPermissionServer = useCallback(
    async (resource, action) => {
      if (!isAuthenticated || !user) {
        return false;
      }

      // Super admin has all permissions
      if (user.role === 'super_admin') {
        return true;
      }

      try {
        // Use server-side permission check API
        const response = await permissionService.checkPermission(resource, action);
        return response.success && response.data?.hasPermission === true;
      } catch (error) {
        console.error('Permission check error:', error);
        // Fallback to client-side check if API fails
        return checkPermissionHelper(permissions, resource, action);
      }
    },
    [permissions, user, isAuthenticated]
  );

  // Check if user has a specific role
  const hasRole = useCallback(
    (role) => {
      if (!isAuthenticated || !user) {
        return false;
      }
      return user.role === role;
    },
    [user, isAuthenticated]
  );

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback(
    (roles) => {
      if (!isAuthenticated || !user) {
        return false;
      }
      return Array.isArray(roles) && roles.includes(user.role);
    },
    [user, isAuthenticated]
  );

  // Check if user can access a resource with any action
  const canAccess = useCallback(
    (resource) => {
      if (!isAuthenticated || !user) {
        return false;
      }

      // Super admin can access everything
      if (user.role === 'super_admin') {
        return true;
      }

      return permissions.some(
        (perm) => perm.resource === resource && perm.isActive !== false
      );
    },
    [permissions, user, isAuthenticated]
  );

  // Fetch resources for sidebar menu
  const fetchResources = useCallback(async () => {
    try {
      setResourcesLoading(true);
      
      // Try to get resources from localStorage first
      const storedResources = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      if (storedResources) {
        try {
          const parsed = JSON.parse(storedResources);
          setResources(parsed);
        } catch (e) {
          // Invalid stored data, ignore
        }
      }

      // Fetch menu resources (showInMenu: true, isActive: true)
      try {
        const menuResponse = await resourceService.getActiveResources();
        console.log('PermissionContext: Menu response', menuResponse);
        
        if (menuResponse && menuResponse.success) {
          // Handle different response structures
          let menuData = [];
          if (Array.isArray(menuResponse.data)) {
            menuData = menuResponse.data;
          } else if (menuResponse.data && Array.isArray(menuResponse.data.resources)) {
            menuData = menuResponse.data.resources;
          } else if (menuResponse.data && menuResponse.data.resources) {
            menuData = Array.isArray(menuResponse.data.resources) ? menuResponse.data.resources : [];
          }
          
          setMenuResources(menuData);
          console.log('PermissionContext: Set menu resources', menuData.length, 'resources');
        } else {
          console.warn('PermissionContext: Menu response not successful', menuResponse);
          setMenuResources([]);
        }
      } catch (error) {
        console.error('PermissionContext: Error fetching menu resources', error);
        setMenuResources([]);
      }

      // Fetch all resources for permission checks
      const allResponse = await resourceService.getAllResources(true);
      if (allResponse.success) {
        const allData = allResponse.data.resources || allResponse.data || [];
        const resourcesArray = Array.isArray(allData) ? allData : [];
        setResources(resourcesArray);
        localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resourcesArray));
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      // If API call fails, try to use stored resources
      const storedResources = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      if (storedResources) {
        try {
          const parsed = JSON.parse(storedResources);
          setResources(parsed);
        } catch (e) {
          // Invalid stored data, ignore
        }
      }
    } finally {
      setResourcesLoading(false);
    }
  }, []);

  // Refresh permissions
  const refreshPermissions = useCallback(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Refresh resources
  const refreshResources = useCallback(() => {
    fetchResources();
  }, [fetchResources]);

  const value = {
    permissions,
    resources,
    menuResources,
    loading,
    resourcesLoading,
    hasPermission, // Synchronous - uses cached permissions
    checkPermissionServer, // Async - calls server API
    hasRole,
    hasAnyRole,
    canAccess,
    refreshPermissions,
    refreshResources,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

