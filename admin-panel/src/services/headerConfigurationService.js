import API from './api';

/**
 * Get all header configurations (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, featured, search, sortBy, sortOrder)
 * @returns {Promise} - Response with header configurations array
 */
export const getAllHeaderConfigurations = async (params = {}) => {
  const response = await API.get('/header-configurations', { params });
  return response.data;
};

/**
 * Get header configuration by ID
 * @param {string} id - Header configuration ID
 * @returns {Promise} - Response with header configuration data
 */
export const getHeaderConfiguration = async (id) => {
  const response = await API.get(`/header-configurations/${id}`);
  return response.data;
};

/**
 * Create new header configuration
 * @param {Object} headerData - Header configuration data
 * @returns {Promise} - Response with created header configuration
 */
export const createHeaderConfiguration = async (headerData) => {
  const response = await API.post('/header-configurations', headerData);
  return response.data;
};

/**
 * Update header configuration
 * @param {string} id - Header configuration ID
 * @param {Object} headerData - Header configuration data to update
 * @returns {Promise} - Response with updated header configuration
 */
export const updateHeaderConfiguration = async (id, headerData) => {
  const response = await API.put(`/header-configurations/${id}`, headerData);
  return response.data;
};

/**
 * Delete header configuration (soft delete)
 * @param {string} id - Header configuration ID
 * @returns {Promise} - Response
 */
export const deleteHeaderConfiguration = async (id) => {
  const response = await API.delete(`/header-configurations/${id}`);
  return response.data;
};

