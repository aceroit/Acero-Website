import API from './api';

/**
 * Get all certifications (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, search, sortBy, sortOrder)
 * @returns {Promise} - Response with certifications array
 */
export const getAllCertifications = async (params = {}) => {
  const response = await API.get('/certifications', { params });
  return response.data;
};

/**
 * Get certification by ID
 * @param {string} id - Certification ID
 * @returns {Promise} - Response with certification data
 */
export const getCertification = async (id) => {
  const response = await API.get(`/certifications/${id}`);
  return response.data;
};

/**
 * Create new certification
 * @param {Object} certificationData - Certification data
 * @returns {Promise} - Response with created certification
 */
export const createCertification = async (certificationData) => {
  const response = await API.post('/certifications', certificationData);
  return response.data;
};

/**
 * Update certification
 * @param {string} id - Certification ID
 * @param {Object} certificationData - Certification data to update
 * @returns {Promise} - Response with updated certification
 */
export const updateCertification = async (id, certificationData) => {
  const response = await API.put(`/certifications/${id}`, certificationData);
  return response.data;
};

/**
 * Delete certification (soft delete)
 * @param {string} id - Certification ID
 * @returns {Promise} - Response
 */
export const deleteCertification = async (id) => {
  const response = await API.delete(`/certifications/${id}`);
  return response.data;
};

