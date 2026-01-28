import API from './api';

/**
 * Get all industries (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, featured, search, sortBy, sortOrder)
 * @returns {Promise} - Response with industries array
 */
export const getAllIndustries = async (params = {}) => {
  const response = await API.get('/industries', { params });
  return response.data;
};

/**
 * Get industry by ID
 * @param {string} id - Industry ID
 * @returns {Promise} - Response with industry data
 */
export const getIndustry = async (id) => {
  const response = await API.get(`/industries/${id}`);
  return response.data;
};

/**
 * Get industry by slug
 * @param {string} slug - Industry slug
 * @returns {Promise} - Response with industry data
 */
export const getIndustryBySlug = async (slug) => {
  const response = await API.get(`/industries/slug/${slug}`);
  return response.data;
};

/**
 * Create new industry
 * @param {Object} industryData - Industry data
 * @returns {Promise} - Response with created industry
 */
export const createIndustry = async (industryData) => {
  const response = await API.post('/industries', industryData);
  return response.data;
};

/**
 * Update industry
 * @param {string} id - Industry ID
 * @param {Object} industryData - Industry data to update
 * @returns {Promise} - Response with updated industry
 */
export const updateIndustry = async (id, industryData) => {
  const response = await API.put(`/industries/${id}`, industryData);
  return response.data;
};

/**
 * Delete industry (soft delete)
 * @param {string} id - Industry ID
 * @returns {Promise} - Response
 */
export const deleteIndustry = async (id) => {
  const response = await API.delete(`/industries/${id}`);
  return response.data;
};

