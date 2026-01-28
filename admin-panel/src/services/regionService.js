import API from './api';

/**
 * Get all regions (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, featured, country, search, sortBy, sortOrder)
 * @returns {Promise} - Response with regions array
 */
export const getAllRegions = async (params = {}) => {
  const response = await API.get('/regions', { params });
  return response.data;
};

/**
 * Get region by ID
 * @param {string} id - Region ID
 * @returns {Promise} - Response with region data
 */
export const getRegion = async (id) => {
  const response = await API.get(`/regions/${id}`);
  return response.data;
};

/**
 * Create new region
 * @param {Object} regionData - Region data
 * @returns {Promise} - Response with created region
 */
export const createRegion = async (regionData) => {
  const response = await API.post('/regions', regionData);
  return response.data;
};

/**
 * Update region
 * @param {string} id - Region ID
 * @param {Object} regionData - Region data to update
 * @returns {Promise} - Response with updated region
 */
export const updateRegion = async (id, regionData) => {
  const response = await API.put(`/regions/${id}`, regionData);
  return response.data;
};

/**
 * Delete region (soft delete)
 * @param {string} id - Region ID
 * @returns {Promise} - Response
 */
export const deleteRegion = async (id) => {
  const response = await API.delete(`/regions/${id}`);
  return response.data;
};

