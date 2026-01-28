import API from './api';

/**
 * Get all SMTP settings (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, featured, search, sortBy, sortOrder)
 * @returns {Promise} - Response with SMTP settings array
 */
export const getAllSMTPSettings = async (params = {}) => {
  const response = await API.get('/smtp-settings', { params });
  return response.data;
};

/**
 * Get SMTP settings by ID
 * @param {string} id - SMTP settings ID
 * @returns {Promise} - Response with SMTP settings data
 */
export const getSMTPSettings = async (id) => {
  const response = await API.get(`/smtp-settings/${id}`);
  return response.data;
};

/**
 * Create new SMTP settings
 * @param {Object} smtpData - SMTP settings data
 * @returns {Promise} - Response with created SMTP settings
 */
export const createSMTPSettings = async (smtpData) => {
  const response = await API.post('/smtp-settings', smtpData);
  return response.data;
};

/**
 * Update SMTP settings
 * @param {string} id - SMTP settings ID
 * @param {Object} smtpData - SMTP settings data to update
 * @returns {Promise} - Response with updated SMTP settings
 */
export const updateSMTPSettings = async (id, smtpData) => {
  const response = await API.put(`/smtp-settings/${id}`, smtpData);
  return response.data;
};

/**
 * Delete SMTP settings (soft delete)
 * @param {string} id - SMTP settings ID
 * @returns {Promise} - Response
 */
export const deleteSMTPSettings = async (id) => {
  const response = await API.delete(`/smtp-settings/${id}`);
  return response.data;
};

