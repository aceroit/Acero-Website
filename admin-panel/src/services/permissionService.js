import API from './api';

/**
 * Get current user's permissions
 * @returns {Promise} - Response with user's permissions
 */
export const getMyPermissions = async () => {
  const response = await API.get('/permissions/me');
  return response.data;
};

/**
 * Get all permissions
 * @returns {Promise} - Response with permissions array
 */
export const getAllPermissions = async () => {
  const response = await API.get('/permissions');
  return response.data;
};

/**
 * Get permission matrix
 * @returns {Promise} - Response with permission matrix
 */
export const getPermissionMatrix = async () => {
  const response = await API.get('/permissions/matrix');
  return response.data;
};

/**
 * Get permissions for a specific role
 * @param {string} role - Role name
 * @returns {Promise} - Response with role permissions
 */
export const getRolePermissions = async (role) => {
  const response = await API.get(`/permissions/role/${role}`);
  return response.data;
};

/**
 * Update permissions for a role
 * @param {string} role - Role name
 * @param {Array} permissions - Array of permission objects
 * @returns {Promise} - Response
 */
export const updateRolePermissions = async (role, permissions) => {
  const response = await API.put(`/permissions/role/${role}`, { permissions });
  return response.data;
};

/**
 * Check if current user has a specific permission
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 * @returns {Promise} - Response with hasPermission boolean
 */
export const checkPermission = async (resource, action) => {
  const response = await API.post('/permissions/check', { resource, action });
  return response.data;
};

/**
 * Get all available resources and actions
 * @returns {Promise} - Response with resources and actions
 */
export const getResourcesAndActions = async () => {
  const response = await API.get('/permissions/resources-actions');
  return response.data;
};

/**
 * Create or update a single permission
 * @param {Object} permissionData - Permission data
 * @returns {Promise} - Response with permission
 */
export const upsertPermission = async (permissionData) => {
  const response = await API.post('/permissions', permissionData);
  return response.data;
};

/**
 * Delete a permission
 * @param {string} id - Permission ID
 * @returns {Promise} - Response
 */
export const deletePermission = async (id) => {
  const response = await API.delete(`/permissions/${id}`);
  return response.data;
};

/**
 * Get users by role
 * @param {string} role - Role name
 * @returns {Promise} - Response with users array
 */
export const getUsersByRole = async (role) => {
  const response = await API.get(`/permissions/role/${role}/users`);
  return response.data;
};

/**
 * Get user-specific permissions by user ID
 * @param {string} userId - User ID
 * @returns {Promise} - Response with user permissions
 */
export const getUserPermissionsById = async (userId) => {
  const response = await API.get(`/permissions/user/${userId}`);
  return response.data;
};

/**
 * Update user-specific permissions
 * @param {string} userId - User ID
 * @param {Array} permissions - Array of permission objects
 * @returns {Promise} - Response
 */
export const updateUserPermissions = async (userId, permissions) => {
  const response = await API.put(`/permissions/user/${userId}`, { permissions });
  return response.data;
};

