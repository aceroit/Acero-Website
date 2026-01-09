/**
 * Check if permissions array includes a specific permission
 * @param {Array} permissions - Array of permission objects
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {boolean} - True if permission exists
 */
export const checkPermission = (permissions, resource, action) => {
  if (!permissions || !Array.isArray(permissions)) {
    return false;
  }

  return permissions.some(
    (perm) =>
      perm.resource === resource &&
      perm.actions &&
      Array.isArray(perm.actions) &&
      perm.actions.includes(action) &&
      perm.isActive !== false
  );
};

/**
 * Filter array of items based on permissions
 * @param {Array} items - Array of items with permission property
 * @param {Array} permissions - User's permissions
 * @returns {Array} - Filtered array
 */
export const filterByPermission = (items, permissions) => {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => {
    // If no permission requirement, always show
    if (!item.permission) {
      return true;
    }

    // Check role-based access
    if (item.roles && Array.isArray(item.roles)) {
      // This will be checked separately with user role
      return true; // Let role check happen in component
    }

    // Check permission-based access
    if (item.permission.resource && item.permission.action) {
      return checkPermission(
        permissions,
        item.permission.resource,
        item.permission.action
      );
    }

    return false;
  });
};

/**
 * Get all permissions for a specific resource
 * @param {Array} permissions - Array of permission objects
 * @param {string} resource - Resource name
 * @returns {Object|null} - Permission object for resource or null
 */
export const getResourcePermissions = (permissions, resource) => {
  if (!permissions || !Array.isArray(permissions)) {
    return null;
  }

  return permissions.find((perm) => perm.resource === resource) || null;
};

/**
 * Get all actions allowed for a resource
 * @param {Array} permissions - Array of permission objects
 * @param {string} resource - Resource name
 * @returns {string[]} - Array of allowed actions
 */
export const getResourceActions = (permissions, resource) => {
  const resourcePerm = getResourcePermissions(permissions, resource);
  return resourcePerm?.actions || [];
};

