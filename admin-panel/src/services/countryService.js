import API from './api';

/**
 * Get all countries (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, featured, isVisible, search, sortBy, sortOrder)
 * @returns {Promise} - Response with countries array
 */
export const getAllCountries = async (params = {}) => {
  const response = await API.get('/countries', { params });
  return response.data;
};

/**
 * Get country by ID
 * @param {string} id - Country ID
 * @returns {Promise} - Response with country data
 */
export const getCountry = async (id) => {
  const response = await API.get(`/countries/${id}`);
  return response.data;
};

/**
 * Get country by code
 * @param {string} code - Country code (e.g., 'US', 'GB')
 * @returns {Promise} - Response with country data
 */
export const getCountryByCode = async (code) => {
  const response = await API.get(`/countries/code/${code}`);
  return response.data;
};

/**
 * Create new country
 * @param {Object} countryData - Country data
 * @returns {Promise} - Response with created country
 */
export const createCountry = async (countryData) => {
  const response = await API.post('/countries', countryData);
  return response.data;
};

/**
 * Update country
 * @param {string} id - Country ID
 * @param {Object} countryData - Country data to update
 * @returns {Promise} - Response with updated country
 */
export const updateCountry = async (id, countryData) => {
  const response = await API.put(`/countries/${id}`, countryData);
  return response.data;
};

/**
 * Delete country (soft delete)
 * @param {string} id - Country ID
 * @returns {Promise} - Response
 */
export const deleteCountry = async (id) => {
  const response = await API.delete(`/countries/${id}`);
  return response.data;
};

