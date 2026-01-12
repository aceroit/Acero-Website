import API from './api';

/**
 * Workflow Service
 * Handles all workflow state transitions and actions
 */

/**
 * Submit content for review (draft → in_review)
 * @param {string} resource - Resource type ('page' or 'section')
 * @param {string} id - Resource ID
 * @param {Object} data - Optional data (changeSummary, message)
 * @returns {Promise} - Response
 */
export const submitForReview = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/submit`, data);
  return response.data;
};

/**
 * Mark content as reviewed (in_review → pending_approval)
 * @param {string} resource - Resource type ('page' or 'section')
 * @param {string} id - Resource ID
 * @param {Object} data - Optional data (feedback, changeSummary)
 * @returns {Promise} - Response
 */
export const markReviewed = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/review`, data);
  return response.data;
};

/**
 * Request changes (in_review/pending_approval → changes_requested)
 * @param {string} resource - Resource type ('page' or 'section')
 * @param {string} id - Resource ID
 * @param {Object} data - Required: feedback, Optional: changeSummary
 * @returns {Promise} - Response
 */
export const requestChanges = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/request-changes`, data);
  return response.data;
};

/**
 * Approve content (pending_approval → pending_publish)
 * @param {string} resource - Resource type ('page' or 'section')
 * @param {string} id - Resource ID
 * @param {Object} data - Optional data (changeSummary)
 * @returns {Promise} - Response
 */
export const approveContent = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/approve`, data);
  return response.data;
};

/**
 * Reject content (pending_approval → changes_requested)
 * @param {string} resource - Resource type ('page' or 'section')
 * @param {string} id - Resource ID
 * @param {Object} data - Required: feedback, Optional: changeSummary
 * @returns {Promise} - Response
 */
export const rejectContent = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/reject`, data);
  return response.data;
};

/**
 * Publish content (pending_publish → published)
 * @param {string} resource - Resource type ('page' or 'section')
 * @param {string} id - Resource ID
 * @param {Object} data - Optional data (changeSummary)
 * @returns {Promise} - Response
 */
export const publishContent = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/publish`, data);
  return response.data;
};

/**
 * Unpublish content (published → draft)
 * @param {string} resource - Resource type ('page' or 'section')
 * @param {string} id - Resource ID
 * @param {Object} data - Optional data (changeSummary)
 * @returns {Promise} - Response
 */
export const unpublishContent = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/unpublish`, data);
  return response.data;
};

/**
 * Archive content (published → archived)
 * @param {string} resource - Resource type ('page' or 'section')
 * @param {string} id - Resource ID
 * @param {Object} data - Optional data (changeSummary)
 * @returns {Promise} - Response
 */
export const archiveContent = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/archive`, data);
  return response.data;
};

/**
 * Restore content (archived → draft)
 * @param {string} resource - Resource type ('page' or 'section')
 * @param {string} id - Resource ID
 * @param {Object} data - Optional data (changeSummary)
 * @returns {Promise} - Response
 */
export const restoreContent = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/restore`, data);
  return response.data;
};

/**
 * Get available workflow actions for current user
 * @param {string} resource - Resource type ('page' or 'section')
 * @param {string} id - Resource ID
 * @returns {Promise} - Response with available actions
 */
export const getAvailableActions = async (resource, id) => {
  const response = await API.get(`/workflow/${resource}/${id}/available-actions`);
  return response.data;
};

