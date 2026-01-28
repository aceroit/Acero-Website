import API from './api';

/**
 * Get all section types
 * @param {boolean} includeInactive - Whether to include inactive section types
 * @returns {Promise} - Response with section types array
 */
export const getAllSectionTypes = async (includeInactive = false) => {
  const response = await API.get('/section-types', {
    params: { includeInactive: includeInactive ? 'true' : 'false' }
  });
  return response.data;
};

/**
 * Get only active section types
 * @returns {Promise} - Response with active section types array
 */
export const getActiveSectionTypes = async () => {
  const response = await API.get('/section-types/active');
  return response.data;
};

/**
 * Get section type by slug
 * @param {string} slug - Section type slug
 * @returns {Promise} - Response with section type data
 */
export const getSectionTypeBySlug = async (slug) => {
  const response = await API.get(`/section-types/${slug}`);
  return response.data;
};

/**
 * Create new section type (Super Admin only)
 * @param {Object} sectionTypeData - Section type data (name, slug, description, category, icon, fields)
 * @returns {Promise} - Response with created section type
 */
export const createSectionType = async (sectionTypeData) => {
  const response = await API.post('/section-types', sectionTypeData);
  return response.data;
};

/**
 * Update section type (Super Admin only)
 * @param {string} slug - Section type slug
 * @param {Object} sectionTypeData - Section type data to update
 * @returns {Promise} - Response with updated section type
 */
export const updateSectionType = async (slug, sectionTypeData) => {
  const response = await API.put(`/section-types/${slug}`, sectionTypeData);
  return response.data;
};

/**
 * Delete section type (Super Admin only)
 * @param {string} slug - Section type slug
 * @returns {Promise} - Response
 */
export const deleteSectionType = async (slug) => {
  const response = await API.delete(`/section-types/${slug}`);
  return response.data;
};

/**
 * Get section type usage statistics
 * @param {string} slug - Section type slug
 * @returns {Promise} - Response with usage count
 */
export const getSectionTypeUsage = async (slug) => {
  const response = await API.get(`/section-types/${slug}/usage`);
  return response.data;
};

