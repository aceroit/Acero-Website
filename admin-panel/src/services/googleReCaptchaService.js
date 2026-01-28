import API from './api';

/**
 * Get all Google ReCaptcha configurations (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, featured, search, sortBy, sortOrder)
 * @returns {Promise} - Response with Google ReCaptcha configurations array
 */
export const getAllGoogleReCaptchas = async (params = {}) => {
  const response = await API.get('/google-recaptcha', { params });
  return response.data;
};

/**
 * Get Google ReCaptcha configuration by ID
 * @param {string} id - Google ReCaptcha configuration ID
 * @returns {Promise} - Response with Google ReCaptcha configuration data
 */
export const getGoogleReCaptcha = async (id) => {
  const response = await API.get(`/google-recaptcha/${id}`);
  return response.data;
};

/**
 * Create new Google ReCaptcha configuration
 * @param {Object} recaptchaData - Google ReCaptcha configuration data
 * @returns {Promise} - Response with created Google ReCaptcha configuration
 */
export const createGoogleReCaptcha = async (recaptchaData) => {
  const response = await API.post('/google-recaptcha', recaptchaData);
  return response.data;
};

/**
 * Update Google ReCaptcha configuration
 * @param {string} id - Google ReCaptcha configuration ID
 * @param {Object} recaptchaData - Google ReCaptcha configuration data to update
 * @returns {Promise} - Response with updated Google ReCaptcha configuration
 */
export const updateGoogleReCaptcha = async (id, recaptchaData) => {
  const response = await API.put(`/google-recaptcha/${id}`, recaptchaData);
  return response.data;
};

/**
 * Delete Google ReCaptcha configuration (soft delete)
 * @param {string} id - Google ReCaptcha configuration ID
 * @returns {Promise} - Response
 */
export const deleteGoogleReCaptcha = async (id) => {
  const response = await API.delete(`/google-recaptcha/${id}`);
  return response.data;
};

