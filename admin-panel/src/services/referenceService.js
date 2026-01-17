import API from './api';

/**
 * Get all active countries
 * @returns {Promise} - Response with countries array
 */
export const getCountries = async () => {
  const response = await API.get('/reference/countries');
  return response.data;
};

/**
 * Get all active regions (optionally filtered by country)
 * @param {string} countryId - Optional country ID to filter regions
 * @returns {Promise} - Response with regions array
 */
export const getRegions = async (countryId = null) => {
  const params = countryId ? { country: countryId } : {};
  const response = await API.get('/reference/regions', { params });
  return response.data;
};

/**
 * Get all active areas (optionally filtered by region or country)
 * @param {string} regionId - Optional region ID to filter areas
 * @param {string} countryId - Optional country ID to filter areas
 * @returns {Promise} - Response with areas array
 */
export const getAreas = async (regionId = null, countryId = null) => {
  const params = {};
  if (regionId) params.region = regionId;
  if (countryId) params.country = countryId;
  const response = await API.get('/reference/areas', { params });
  return response.data;
};

/**
 * Get all active industries
 * @returns {Promise} - Response with industries array
 */
export const getIndustries = async () => {
  const response = await API.get('/reference/industries');
  return response.data;
};

/**
 * Get all active building types
 * @returns {Promise} - Response with building types array
 */
export const getBuildingTypes = async () => {
  const response = await API.get('/reference/building-types');
  return response.data;
};

