import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as permissionService from '../services/permissionService';
import * as resourceService from '../services/resourceService';
import * as roleService from '../services/roleService';
import { STORAGE_KEYS } from '../utils/constants';
import { checkPermission as checkPermissionHelper } from '../utils/permissionHelpers';
import { getRoleSlug, getRoleDisplayName, formatRole } from '../utils/roleHelpers';

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [resources, setResources] = useState([]);
  const [menuResources, setMenuResources] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Fetch permissions, resources, and roles when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPermissions();
      fetchResources();
      fetchRoles();
    } else {
      setPermissions([]);
      setResources([]);
      setMenuResources([]);
      setRoles([]);
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

  // Helper to get user role slug
  const getUserRoleSlug = useCallback(() => {
    if (!user?.role) return null;
    if (typeof user.role === 'object' && user.role.slug) {
      return user.role.slug;
    }
    if (typeof user.role === 'string') {
      return user.role;
    }
    return null;
  }, [user]);

  // Check if user has a specific permission (synchronous - uses cached permissions)
  const hasPermission = useCallback(
    (resource, action) => {
      if (!isAuthenticated || !user) {
        return false;
      }

      // Super admin has all permissions
      // Note: For super_admin, permissions array is empty but hasAllPermissions flag indicates all access
      const userRoleSlug = getUserRoleSlug();
      if (userRoleSlug === 'super_admin') {
        return true;
      }

      // For other roles, check against loaded permissions
      return checkPermissionHelper(permissions, resource, action);
    },
    [permissions, user, isAuthenticated, getUserRoleSlug]
  );

  // Server-side permission check (async - calls API)
  const checkPermissionServer = useCallback(
    async (resource, action) => {
      if (!isAuthenticated || !user) {
        return false;
      }

      // Super admin has all permissions
      const userRoleSlug = getUserRoleSlug();
      if (userRoleSlug === 'super_admin') {
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
    [permissions, user, isAuthenticated, getUserRoleSlug]
  );

  // Check if user has a specific role
  const hasRole = useCallback(
    (role) => {
      if (!isAuthenticated || !user) {
        return false;
      }
      
      const userRoleSlug = getUserRoleSlug();
      if (!userRoleSlug) return false;
      
      // Handle role as string (slug), ObjectId, or Role object
      if (typeof role === 'string') {
        return userRoleSlug === role;
      }
      
      if (typeof role === 'object') {
        const roleSlug = role.slug || getRoleSlug(role);
        return userRoleSlug === roleSlug;
      }
      
      return false;
    },
    [user, isAuthenticated, getUserRoleSlug]
  );

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback(
    (rolesArray) => {
      if (!isAuthenticated || !user) {
        return false;
      }
      
      const userRoleSlug = getUserRoleSlug();
      if (!userRoleSlug || !Array.isArray(rolesArray)) {
        return false;
      }
      
      return rolesArray.some(role => {
        if (typeof role === 'string') {
          return userRoleSlug === role;
        }
        if (typeof role === 'object') {
          const roleSlug = role.slug || getRoleSlug(role);
          return userRoleSlug === roleSlug;
        }
        return false;
      });
    },
    [user, isAuthenticated, getUserRoleSlug]
  );

  // Check if user can access a resource with any action
  const canAccess = useCallback(
    (resource) => {
      if (!isAuthenticated || !user) {
        return false;
      }

      // Super admin can access everything
      const userRoleSlug = getUserRoleSlug();
      if (userRoleSlug === 'super_admin') {
        return true;
      }

      return permissions.some(
        (perm) => perm.resource === resource && perm.isActive !== false
      );
    },
    [permissions, user, isAuthenticated, getUserRoleSlug]
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

  // Fetch roles from API
  const fetchRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      
      // Try to get roles from localStorage first
      const storedRoles = localStorage.getItem(STORAGE_KEYS.ROLES);
      if (storedRoles) {
        try {
          const parsed = JSON.parse(storedRoles);
          setRoles(parsed);
        } catch (e) {
          // Invalid stored data, ignore
        }
      }

      // Fetch active roles from API
      const response = await roleService.getActiveRoles(true); // Include system roles
      if (response.success) {
        const rolesData = response.data.roles || response.data || [];
        const rolesArray = Array.isArray(rolesData) ? rolesData : [];
        setRoles(rolesArray);
        localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(rolesArray));
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      // If API call fails, try to use stored roles
      const storedRoles = localStorage.getItem(STORAGE_KEYS.ROLES);
      if (storedRoles) {
        try {
          const parsed = JSON.parse(storedRoles);
          setRoles(parsed);
        } catch (e) {
          // Invalid stored data, ignore
        }
      }
    } finally {
      setRolesLoading(false);
    }
  }, []);

  // Refresh resources
  const refreshResources = useCallback(() => {
    fetchResources();
  }, [fetchResources]);

  // Refresh roles
  const refreshRoles = useCallback(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Get role by slug or ObjectId
  const getRole = useCallback((roleIdentifier) => {
    if (!roleIdentifier) return null;
    
    // If it's already a role object, return it
    if (typeof roleIdentifier === 'object' && roleIdentifier._id) {
      return roleIdentifier;
    }
    
    // Find by slug or _id
    return roles.find(role => 
      role.slug === roleIdentifier || 
      role._id === roleIdentifier ||
      role._id?.toString() === roleIdentifier?.toString()
    ) || null;
  }, [roles]);

  // Get role display name
  const getRoleName = useCallback((roleIdentifier) => {
    const role = getRole(roleIdentifier);
    if (role) {
      return getRoleDisplayName(role);
    }
    return formatRole(roleIdentifier);
  }, [getRole, roles]);

  const value = {
    permissions,
    resources,
    menuResources,
    roles,
    loading,
    resourcesLoading,
    rolesLoading,
    hasPermission, // Synchronous - uses cached permissions
    checkPermissionServer, // Async - calls server API
    hasRole,
    hasAnyRole,
    canAccess,
    refreshPermissions,
    refreshResources,
    refreshRoles,
    getRole, // Get role by slug or ObjectId
    getRoleName, // Get role display name
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

