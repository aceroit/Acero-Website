import API from './api';

/**
 * Get all company update categories (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, search, sortBy, sortOrder)
 * @returns {Promise} - Response with company update categories array
 */
export const getAllCompanyUpdateCategories = async (params = {}) => {
  const response = await API.get('/company-update-categories', { params });
  return response.data;
};

/**
 * Get company update category by ID
 * @param {string} id - Company update category ID
 * @returns {Promise} - Response with company update category data
 */
export const getCompanyUpdateCategory = async (id) => {
  const response = await API.get(`/company-update-categories/${id}`);
  return response.data;
};

/**
 * Get company update category by slug
 * @param {string} slug - Company update category slug
 * @returns {Promise} - Response with company update category data
 */
export const getCompanyUpdateCategoryBySlug = async (slug) => {
  const response = await API.get(`/company-update-categories/slug/${slug}`);
  return response.data;
};

/**
 * Create new company update category
 * @param {Object} categoryData - Company update category data
 * @returns {Promise} - Response with created company update category
 */
export const createCompanyUpdateCategory = async (categoryData) => {
  const response = await API.post('/company-update-categories', categoryData);
  return response.data;
};

/**
 * Update company update category
 * @param {string} id - Company update category ID
 * @param {Object} categoryData - Company update category data to update
 * @returns {Promise} - Response with updated company update category
 */
export const updateCompanyUpdateCategory = async (id, categoryData) => {
  const response = await API.put(`/company-update-categories/${id}`, categoryData);
  return response.data;
};

/**
 * Delete company update category (soft delete)
 * @param {string} id - Company update category ID
 * @returns {Promise} - Response
 */
export const deleteCompanyUpdateCategory = async (id) => {
  const response = await API.delete(`/company-update-categories/${id}`);
  return response.data;
};

