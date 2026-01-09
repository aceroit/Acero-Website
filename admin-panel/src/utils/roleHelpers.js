import { ROLES, ROLE_DISPLAY_NAMES } from './constants';

/**
 * Format role for display
 * @param {string} role - Role string (e.g., 'super_admin')
 * @returns {string} - Formatted role (e.g., 'Super Admin')
 */
export const formatRole = (role) => {
  if (!role) {
    return 'Unknown';
  }
  
  if (ROLE_DISPLAY_NAMES[role]) {
    return ROLE_DISPLAY_NAMES[role];
  }
  
  return role
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
 * @param {string} role - Role string
 * @returns {string} - Color name for Tag component
 */
export const getRoleColor = (role) => {
  const roleColors = {
    'super_admin': 'red',
    'admin': 'blue',
    'approver': 'purple',
    'reviewer': 'orange',
    'editor': 'green',
    'viewer': 'default'
  };
  return roleColors[role] || 'default';
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

