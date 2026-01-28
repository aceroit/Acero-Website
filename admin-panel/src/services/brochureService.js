import API from './api';

/**
 * Get all brochures (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, search, sortBy, sortOrder)
 * @returns {Promise} - Response with brochures array
 */
export const getAllBrochures = async (params = {}) => {
  const response = await API.get('/brochures', { params });
  return response.data;
};

/**
 * Get brochure by ID
 * @param {string} id - Brochure ID
 * @returns {Promise} - Response with brochure data
 */
export const getBrochure = async (id) => {
  const response = await API.get(`/brochures/${id}`);
  return response.data;
};

/**
 * Create new brochure
 * @param {Object} brochureData - Brochure data
 * @returns {Promise} - Response with created brochure
 */
export const createBrochure = async (brochureData) => {
  const response = await API.post('/brochures', brochureData);
  return response.data;
};

/**
 * Update brochure
 * @param {string} id - Brochure ID
 * @param {Object} brochureData - Brochure data to update
 * @returns {Promise} - Response with updated brochure
 */
export const updateBrochure = async (id, brochureData) => {
  const response = await API.put(`/brochures/${id}`, brochureData);
  return response.data;
};

/**
 * Delete brochure (soft delete)
 * @param {string} id - Brochure ID
 * @returns {Promise} - Response
 */
export const deleteBrochure = async (id) => {
  const response = await API.delete(`/brochures/${id}`);
  return response.data;
};

