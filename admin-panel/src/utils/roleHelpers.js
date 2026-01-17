import { ROLES, ROLE_DISPLAY_NAMES } from './constants';

/**
 * Format role for display
 * @param {string|Object} role - Role string (e.g., 'super_admin') or Role object with name/slug
 * @returns {string} - Formatted role (e.g., 'Super Admin')
 */
export const formatRole = (role) => {
  if (!role) {
    return 'Unknown';
  }
  
  // If role is an object with name field (Role model)
  if (typeof role === 'object' && role.name) {
    return role.name;
  }
  
  // If role is an object with slug but no name, format the slug
  if (typeof role === 'object' && role.slug) {
    const slug = role.slug;
    if (ROLE_DISPLAY_NAMES[slug]) {
      return ROLE_DISPLAY_NAMES[slug];
    }
    return slug
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // If role is a string
  const roleString = typeof role === 'string' ? role : String(role);
  
  if (ROLE_DISPLAY_NAMES[roleString]) {
    return ROLE_DISPLAY_NAMES[roleString];
  }
  
  return roleString
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Get user's full name from firstName and lastName
 * @param {Object} user - User object with firstName and lastName
 * @returns {string} - Full name or fallback
 */
export const getUserFullName = (user) => {
  if (!user) {
    return 'User';
  }
  
  // If user has a name field (legacy support)
  if (user.name) {
    return user.name;
  }
  
  // Use firstName and lastName
  if (user.firstName || user.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
  }
  
  return 'User';
};

/**
 * Get color for role badge
 * @param {string|Object} role - Role string or Role object with color/slug
 * @returns {string} - Color name for Tag component
 */
export const getRoleColor = (role) => {
  // If role is an object with color field (Role model)
  if (typeof role === 'object' && role.color && role.color !== 'default') {
    return role.color;
  }
  
  // Fallback to slug-based color mapping
  const roleSlug = typeof role === 'object' ? (role.slug || role.name) : role;
  const roleString = typeof roleSlug === 'string' ? roleSlug : String(roleSlug);
  
  const roleColors = {
    'super_admin': 'red',
    'admin': 'blue',
    'approver': 'purple',
    'reviewer': 'orange',
    'editor': 'green',
    'viewer': 'default'
  };
  return roleColors[roleString] || 'default';
};

/**
 * Get role hierarchy (higher number = more privileges)
 * @returns {Object} - Role hierarchy mapping
 */
export const getRoleHierarchy = () => {
  return {
    [ROLES.SUPER_ADMIN]: 6,
    [ROLES.ADMIN]: 5,
    [ROLES.APPROVER]: 4,
    [ROLES.REVIEWER]: 3,
    [ROLES.EDITOR]: 2,
    [ROLES.VIEWER]: 1
  };
};

/**
 * Check if a user can manage another role
 * @param {string} userRole - Current user's role
 * @param {string} targetRole - Target role to manage
 * @returns {boolean} - True if user can manage target role
 */
export const canManageRole = (userRole, targetRole) => {
  const hierarchy = getRoleHierarchy();
  const userLevel = hierarchy[userRole] || 0;
  const targetLevel = hierarchy[targetRole] || 0;
  
  // Super admin can manage all roles except themselves (handled separately)
  if (userRole === ROLES.SUPER_ADMIN) {
    return targetRole !== ROLES.SUPER_ADMIN;
  }
  
  // Users can only manage roles lower than their own
  return userLevel > targetLevel;
};

/**
 * Get all roles that a user can manage
 * @param {string} userRole - Current user's role
 * @returns {string[]} - Array of manageable roles
 */
export const getManageableRoles = (userRole) => {
  const hierarchy = getRoleHierarchy();
  const userLevel = hierarchy[userRole] || 0;
  
  return Object.entries(hierarchy)
    .filter(([role, level]) => level < userLevel && role !== userRole)
    .map(([role]) => role);
};

/**
 * Get role display name from Role object or string
 * @param {string|Object} role - Role string or Role object
 * @returns {string} - Display name for the role
 */
export const getRoleDisplayName = (role) => {
  if (!role) {
    return 'Unknown';
  }
  
  // If role is an object with name field (Role model)
  if (typeof role === 'object' && role.name) {
    return role.name;
  }
  
  // If role is an object with slug but no name
  if (typeof role === 'object' && role.slug) {
    return formatRole(role.slug);
  }
  
  // If role is a string, use formatRole
  return formatRole(role);
};

/**
 * Get role slug from Role object or string
 * @param {string|Object} role - Role string or Role object
 * @returns {string} - Slug for the role
 */
export const getRoleSlug = (role) => {
  if (!role) {
    return '';
  }
  
  // If role is an object with slug field
  if (typeof role === 'object' && role.slug) {
    return role.slug;
  }
  
  // If role is an object with name, convert to slug
  if (typeof role === 'object' && role.name) {
    return role.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_-]/g, '');
  }
  
  // If role is a string, return as is
  return typeof role === 'string' ? role : String(role);
};

