import API from './api';

/**
 * Get all website appearances (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, featured, search, sortBy, sortOrder)
 * @returns {Promise} - Response with website appearances array
 */
export const getAllWebsiteAppearances = async (params = {}) => {
  const response = await API.get('/website-appearance', { params });
  return response.data;
};

/**
 * Get website appearance by ID
 * @param {string} id - Website appearance ID
 * @returns {Promise} - Response with website appearance data
 */
export const getWebsiteAppearance = async (id) => {
  const response = await API.get(`/website-appearance/${id}`);
  return response.data;
};

/**
 * Create new website appearance
 * @param {Object} appearanceData - Website appearance data
 * @returns {Promise} - Response with created website appearance
 */
export const createWebsiteAppearance = async (appearanceData) => {
  const response = await API.post('/website-appearance', appearanceData);
  return response.data;
};

/**
 * Update website appearance
 * @param {string} id - Website appearance ID
 * @param {Object} appearanceData - Website appearance data to update
 * @returns {Promise} - Response with updated website appearance
 */
export const updateWebsiteAppearance = async (id, appearanceData) => {
  const response = await API.put(`/website-appearance/${id}`, appearanceData);
  return response.data;
};

/**
 * Delete website appearance (soft delete)
 * @param {string} id - Website appearance ID
 * @returns {Promise} - Response
 */
export const deleteWebsiteAppearance = async (id) => {
  const response = await API.delete(`/website-appearance/${id}`);
  return response.data;
};

