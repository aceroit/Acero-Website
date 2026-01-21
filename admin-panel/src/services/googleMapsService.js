import API from './api';

/**
 * Get all Google Maps configurations (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, featured, search, sortBy, sortOrder)
 * @returns {Promise} - Response with Google Maps configurations array
 */
export const getAllGoogleMaps = async (params = {}) => {
  const response = await API.get('/google-maps', { params });
  return response.data;
};

/**
 * Get Google Maps configuration by ID
 * @param {string} id - Google Maps configuration ID
 * @returns {Promise} - Response with Google Maps configuration data
 */
export const getGoogleMaps = async (id) => {
  const response = await API.get(`/google-maps/${id}`);
  return response.data;
};

/**
 * Create new Google Maps configuration
 * @param {Object} mapsData - Google Maps configuration data
 * @returns {Promise} - Response with created Google Maps configuration
 */
export const createGoogleMaps = async (mapsData) => {
  const response = await API.post('/google-maps', mapsData);
  return response.data;
};

/**
 * Update Google Maps configuration
 * @param {string} id - Google Maps configuration ID
 * @param {Object} mapsData - Google Maps configuration data to update
 * @returns {Promise} - Response with updated Google Maps configuration
 */
export const updateGoogleMaps = async (id, mapsData) => {
  const response = await API.put(`/google-maps/${id}`, mapsData);
  return response.data;
};

/**
 * Delete Google Maps configuration (soft delete)
 * @param {string} id - Google Maps configuration ID
 * @returns {Promise} - Response
 */
export const deleteGoogleMaps = async (id) => {
  const response = await API.delete(`/google-maps/${id}`);
  return response.data;
};

