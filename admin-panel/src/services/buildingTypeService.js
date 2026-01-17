import API from './api';

/**
 * Get all building types (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, featured, search, sortBy, sortOrder)
 * @returns {Promise} - Response with building types array
 */
export const getAllBuildingTypes = async (params = {}) => {
  const response = await API.get('/building-types', { params });
  return response.data;
};

/**
 * Get building type by ID
 * @param {string} id - Building type ID
 * @returns {Promise} - Response with building type data
 */
export const getBuildingType = async (id) => {
  const response = await API.get(`/building-types/${id}`);
  return response.data;
};

/**
 * Create new building type
 * @param {Object} buildingTypeData - Building type data
 * @returns {Promise} - Response with created building type
 */
export const createBuildingType = async (buildingTypeData) => {
  const response = await API.post('/building-types', buildingTypeData);
  return response.data;
};

/**
 * Update building type
 * @param {string} id - Building type ID
 * @param {Object} buildingTypeData - Building type data to update
 * @returns {Promise} - Response with updated building type
 */
export const updateBuildingType = async (id, buildingTypeData) => {
  const response = await API.put(`/building-types/${id}`, buildingTypeData);
  return response.data;
};

/**
 * Delete building type (soft delete)
 * @param {string} id - Building type ID
 * @returns {Promise} - Response
 */
export const deleteBuildingType = async (id) => {
  const response = await API.delete(`/building-types/${id}`);
  return response.data;
};

