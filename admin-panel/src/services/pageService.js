import API from './api';

/**
 * Get hierarchical page tree
 * @returns {Promise} - Response with page tree array
 */
export const getPageTree = async () => {
  const response = await API.get('/pages/tree');
  return response.data;
};

/**
 * Get all pages (flat list) with optional filters
 * @param {Object} params - Query parameters (page, limit, search, status, etc.)
 * @returns {Promise} - Response with pages array
 */
export const getAllPages = async (params = {}) => {
  const response = await API.get('/pages', { params });
  return response.data;
};

/**
 * Get page by ID
 * @param {string} id - Page ID
 * @returns {Promise} - Response with page data
 */
export const getPageById = async (id) => {
  const response = await API.get(`/pages/${id}`);
  return response.data;
};

/**
 * Create new page
 * @param {Object} pageData - Page data (title, slug, parentId, metaTitle, etc.)
 * @returns {Promise} - Response with created page
 */
export const createPage = async (pageData) => {
  const response = await API.post('/pages', pageData);
  return response.data;
};

/**
 * Update page
 * @param {string} id - Page ID
 * @param {Object} pageData - Page data to update
 * @returns {Promise} - Response with updated page
 */
export const updatePage = async (id, pageData) => {
  const response = await API.put(`/pages/${id}`, pageData);
  return response.data;
};

/**
 * Delete page (soft delete)
 * @param {string} id - Page ID
 * @returns {Promise} - Response
 */
export const deletePage = async (id) => {
  const response = await API.delete(`/pages/${id}`);
  return response.data;
};

/**
 * Get direct children of a page
 * @param {string} id - Page ID
 * @returns {Promise} - Response with children pages array
 */
export const getPageChildren = async (id) => {
  const response = await API.get(`/pages/${id}/children`);
  return response.data;
};

/**
 * Get breadcrumb trail for a page
 * @param {string} id - Page ID
 * @returns {Promise} - Response with breadcrumb array
 */
export const getPageBreadcrumb = async (id) => {
  const response = await API.get(`/pages/${id}/breadcrumb`);
  return response.data;
};

/**
 * Duplicate a page
 * @param {string} id - Page ID to duplicate
 * @param {Object} options - Options (includeSections: boolean)
 * @returns {Promise} - Response with duplicated page
 */
export const duplicatePage = async (id, options = {}) => {
  const response = await API.post(`/pages/${id}/duplicate`, options);
  return response.data;
};

/**
 * Move page to new parent
 * @param {string} id - Page ID
 * @param {string} newParentId - New parent page ID (null for root)
 * @returns {Promise} - Response with updated page
 */
export const movePage = async (id, newParentId) => {
  const response = await API.put(`/pages/${id}/move`, { newParentId });
  return response.data;
};

/**
 * Reorder pages (siblings)
 * @param {Array} pages - Array of { _id, order } objects
 * @returns {Promise} - Response
 */
export const reorderPages = async (pages) => {
  const response = await API.put('/pages/reorder', { pages });
  return response.data;
};

