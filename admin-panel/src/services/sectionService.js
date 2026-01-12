import API from './api';

/**
 * Get all sections for a page
 * @param {string} pageId - Page ID
 * @param {boolean} includeHidden - Whether to include hidden sections (default: false)
 * @returns {Promise} - Response with sections array
 */
export const getPageSections = async (pageId, includeHidden = false) => {
  const response = await API.get(`/sections/pages/${pageId}/sections`, {
    params: { includeHidden: includeHidden ? 'true' : 'false' }
  });
  return response.data;
};

/**
 * Get section by ID
 * @param {string} id - Section ID
 * @returns {Promise} - Response with section data
 */
export const getSectionById = async (id) => {
  const response = await API.get(`/sections/${id}`);
  return response.data;
};

/**
 * Create section for a page
 * @param {string} pageId - Page ID
 * @param {Object} sectionData - Section data (sectionTypeSlug, order, content, isVisible)
 * @returns {Promise} - Response with created section
 */
export const createSection = async (pageId, sectionData) => {
  const response = await API.post(`/sections/pages/${pageId}/sections`, sectionData);
  return response.data;
};

/**
 * Update section
 * @param {string} id - Section ID
 * @param {Object} sectionData - Section data to update
 * @returns {Promise} - Response with updated section
 */
export const updateSection = async (id, sectionData) => {
  const response = await API.put(`/sections/${id}`, sectionData);
  return response.data;
};

/**
 * Delete section
 * @param {string} id - Section ID
 * @returns {Promise} - Response
 */
export const deleteSection = async (id) => {
  const response = await API.delete(`/sections/${id}`);
  return response.data;
};

/**
 * Get sections by type
 * @param {string} slug - Section type slug
 * @returns {Promise} - Response with sections array
 */
export const getSectionsByType = async (slug) => {
  const response = await API.get(`/sections/type/${slug}`);
  return response.data;
};

/**
 * Reorder sections within a page
 * @param {Array} sectionOrders - Array of { sectionId, order } objects
 * @returns {Promise} - Response
 */
export const reorderSections = async (sectionOrders) => {
  const response = await API.put('/sections/reorder', { sectionOrders });
  return response.data;
};

/**
 * Duplicate a section
 * @param {string} id - Section ID to duplicate
 * @returns {Promise} - Response with duplicated section
 */
export const duplicateSection = async (id) => {
  const response = await API.post(`/sections/${id}/duplicate`);
  return response.data;
};

/**
 * Toggle section visibility
 * @param {string} id - Section ID
 * @returns {Promise} - Response with updated section
 */
export const toggleVisibility = async (id) => {
  const response = await API.put(`/sections/${id}/visibility`);
  return response.data;
};

