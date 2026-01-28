import API from './api';

/**
 * Get all areas (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, featured, region, country, search, sortBy, sortOrder)
 * @returns {Promise} - Response with areas array
 */
export const getAllAreas = async (params = {}) => {
  const response = await API.get('/areas', { params });
  return response.data;
};

/**
 * Get area by ID
 * @param {string} id - Area ID
 * @returns {Promise} - Response with area data
 */
export const getArea = async (id) => {
  const response = await API.get(`/areas/${id}`);
  return response.data;
};

/**
 * Create new area
 * @param {Object} areaData - Area data
 * @returns {Promise} - Response with created area
 */
export const createArea = async (areaData) => {
  const response = await API.post('/areas', areaData);
  return response.data;
};

/**
 * Update area
 * @param {string} id - Area ID
 * @param {Object} areaData - Area data to update
 * @returns {Promise} - Response with updated area
 */
export const updateArea = async (id, areaData) => {
  const response = await API.put(`/areas/${id}`, areaData);
  return response.data;
};

/**
 * Delete area (soft delete)
 * @param {string} id - Area ID
 * @returns {Promise} - Response
 */
export const deleteArea = async (id) => {
  const response = await API.delete(`/areas/${id}`);
  return response.data;
};

