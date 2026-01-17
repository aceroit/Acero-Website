import API from './api';

/**
 * Get all roles
 * @param {Object} params - Query parameters (includeInactive, includeSystem, page, limit, search)
 * @returns {Promise} - Response with roles array
 */
export const getAllRoles = async (params = {}) => {
  const response = await API.get('/roles', { params });
  return response.data;
};

/**
 * Get only active roles
 * @param {boolean} includeSystem - Whether to include system roles
 * @returns {Promise} - Response with active roles array
 */
export const getActiveRoles = async (includeSystem = true) => {
  const response = await API.get('/roles', {
    params: {
      isActive: 'true',
      includeSystem: includeSystem ? 'true' : 'false'
    }
  });
  return response.data;
};

/**
 * Get role by ID
 * @param {string} id - Role ID
 * @returns {Promise} - Response with role data
 */
export const getRoleById = async (id) => {
  const response = await API.get(`/roles/${id}`);
  return response.data;
};

/**
 * Get role by slug
 * @param {string} slug - Role slug
 * @returns {Promise} - Response with role data
 */
export const getRoleBySlug = async (slug) => {
  const response = await API.get(`/roles/slug/${slug}`);
  return response.data;
};

/**
 * Create new role (Super Admin only)
 * @param {Object} roleData - Role data (name, slug, description, level, color, isActive, metadata)
 * @returns {Promise} - Response with created role
 */
export const createRole = async (roleData) => {
  const response = await API.post('/roles', roleData);
  return response.data;
};

/**
 * Update role (Super Admin only)
 * @param {string} id - Role ID
 * @param {Object} roleData - Role data to update
 * @returns {Promise} - Response with updated role
 */
export const updateRole = async (id, roleData) => {
  const response = await API.put(`/roles/${id}`, roleData);
  return response.data;
};

/**
 * Delete role (Super Admin only)
 * @param {string} id - Role ID
 * @returns {Promise} - Response
 */
export const deleteRole = async (id) => {
  const response = await API.delete(`/roles/${id}`);
  return response.data;
};

/**
 * Get role usage statistics
 * @param {string} id - Role ID
 * @returns {Promise} - Response with usage statistics (userCount, permissionCount, pageCount)
 */
export const getRoleUsage = async (id) => {
  const response = await API.get(`/roles/${id}/usage`);
  return response.data;
};

