import API from './api';

/**
 * Get all resources
 * @param {boolean} includeInactive - Whether to include inactive resources
 * @returns {Promise} - Response with resources array
 */
export const getAllResources = async (includeInactive = false) => {
  const response = await API.get('/resources', {
    params: { includeInactive: includeInactive ? 'true' : 'false' }
  });
  return response.data;
};

/**
 * Get only active resources
 * @returns {Promise} - Response with active resources array
 */
export const getActiveResources = async () => {
  const response = await API.get('/resources/menu');
  return response.data;
};

/**
 * Get resource by ID
 * @param {string} id - Resource ID
 * @returns {Promise} - Response with resource data
 */
export const getResourceById = async (id) => {
  const response = await API.get(`/resources/${id}`);
  return response.data;
};

/**
 * Get resource by slug
 * @param {string} slug - Resource slug
 * @returns {Promise} - Response with resource data
 */
export const getResourceBySlug = async (slug) => {
  const response = await API.get(`/resources/slug/${slug}`);
  return response.data;
};

/**
 * Get resource tree (hierarchical structure)
 * @returns {Promise} - Response with resource tree
 */
export const getResourceTree = async () => {
  const response = await API.get('/resources/tree');
  return response.data;
};

/**
 * Get resources by category
 * @param {string} category - Category name
 * @returns {Promise} - Response with resources array
 */
export const getResourcesByCategory = async (category) => {
  const response = await API.get('/resources/category', {
    params: { category }
  });
  return response.data;
};

/**
 * Create new resource (Super Admin only)
 * @param {Object} resourceData - Resource data (name, slug, path, parentId, icon, description, category, showInMenu, order, isActive, metadata)
 * @returns {Promise} - Response with created resource
 */
export const createResource = async (resourceData) => {
  const response = await API.post('/resources', resourceData);
  return response.data;
};

/**
 * Update resource (Super Admin only)
 * @param {string} id - Resource ID
 * @param {Object} resourceData - Resource data to update
 * @returns {Promise} - Response with updated resource
 */
export const updateResource = async (id, resourceData) => {
  const response = await API.put(`/resources/${id}`, resourceData);
  return response.data;
};

/**
 * Delete resource (Super Admin only)
 * @param {string} id - Resource ID
 * @returns {Promise} - Response
 */
export const deleteResource = async (id) => {
  const response = await API.delete(`/resources/${id}`);
  return response.data;
};

/**
 * Get resource usage statistics
 * @param {string} slug - Resource slug
 * @returns {Promise} - Response with usage count
 */
export const getResourceUsage = async (slug) => {
  const response = await API.get(`/resources/slug/${slug}/usage`);
  return response.data;
};

