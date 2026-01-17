import API from './api';

/**
 * Get all company updates (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, category, search, sortBy, sortOrder)
 * @returns {Promise} - Response with company updates array
 */
export const getAllCompanyUpdates = async (params = {}) => {
  const response = await API.get('/company-updates', { params });
  return response.data;
};

/**
 * Get company update by ID
 * @param {string} id - Company update ID
 * @returns {Promise} - Response with company update data
 */
export const getCompanyUpdate = async (id) => {
  const response = await API.get(`/company-updates/${id}`);
  return response.data;
};

/**
 * Get company update by slug
 * @param {string} slug - Company update slug
 * @returns {Promise} - Response with company update data
 */
export const getCompanyUpdateBySlug = async (slug) => {
  const response = await API.get(`/company-updates/slug/${slug}`);
  return response.data;
};

/**
 * Create new company update
 * @param {Object} companyUpdateData - Company update data
 * @returns {Promise} - Response with created company update
 */
export const createCompanyUpdate = async (companyUpdateData) => {
  const response = await API.post('/company-updates', companyUpdateData);
  return response.data;
};

/**
 * Update company update
 * @param {string} id - Company update ID
 * @param {Object} companyUpdateData - Company update data to update
 * @returns {Promise} - Response with updated company update
 */
export const updateCompanyUpdate = async (id, companyUpdateData) => {
  const response = await API.put(`/company-updates/${id}`, companyUpdateData);
  return response.data;
};

/**
 * Delete company update (soft delete)
 * @param {string} id - Company update ID
 * @returns {Promise} - Response
 */
export const deleteCompanyUpdate = async (id) => {
  const response = await API.delete(`/company-updates/${id}`);
  return response.data;
};

