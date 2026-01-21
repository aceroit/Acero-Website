import API from './api';

/**
 * Get all footer configurations (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, featured, search, sortBy, sortOrder)
 * @returns {Promise} - Response with footer configurations array
 */
export const getAllFooterConfigurations = async (params = {}) => {
  const response = await API.get('/footer-configurations', { params });
  return response.data;
};

/**
 * Get footer configuration by ID
 * @param {string} id - Footer configuration ID
 * @returns {Promise} - Response with footer configuration data
 */
export const getFooterConfiguration = async (id) => {
  const response = await API.get(`/footer-configurations/${id}`);
  return response.data;
};

/**
 * Create new footer configuration
 * @param {Object} footerData - Footer configuration data
 * @returns {Promise} - Response with created footer configuration
 */
export const createFooterConfiguration = async (footerData) => {
  const response = await API.post('/footer-configurations', footerData);
  return response.data;
};

/**
 * Update footer configuration
 * @param {string} id - Footer configuration ID
 * @param {Object} footerData - Footer configuration data to update
 * @returns {Promise} - Response with updated footer configuration
 */
export const updateFooterConfiguration = async (id, footerData) => {
  const response = await API.put(`/footer-configurations/${id}`, footerData);
  return response.data;
};

/**
 * Delete footer configuration (soft delete)
 * @param {string} id - Footer configuration ID
 * @returns {Promise} - Response
 */
export const deleteFooterConfiguration = async (id) => {
  const response = await API.delete(`/footer-configurations/${id}`);
  return response.data;
};

