import API from './api';

/**
 * Version Service
 * Handles content versioning operations
 */

/**
 * Get version history for a resource
 * @param {string} resource - Resource type ('page' or 'section')
 * @param {string} id - Resource ID
 * @param {Object} params - Optional query parameters (limit, version)
 * @returns {Promise} - Response with versions array
 */
export const getVersionHistory = async (resource, id, params = {}) => {
  const response = await API.get(`/workflow/${resource}/${id}/versions`, { params });
  return response.data;
};

/**
 * Get a specific version
 * @param {string} resource - Resource type ('page' or 'section')
 * @param {string} id - Resource ID
 * @param {number} version - Version number
 * @returns {Promise} - Response with version data
 */
export const getVersion = async (resource, id, version) => {
  const response = await API.get(`/workflow/${resource}/${id}/versions`, {
    params: { version }
  });
  return response.data;
};

/**
 * Compare two versions
 * @param {string} resource - Resource type ('page' or 'section')
 * @param {string} id - Resource ID
 * @param {number} version1 - First version number
 * @param {number} version2 - Second version number
 * @returns {Promise} - Response with comparison data
 */
export const compareVersions = async (resource, id, version1, version2) => {
  const response = await API.get(`/workflow/${resource}/${id}/versions/compare`, {
    params: {
      version1,
      version2,
      // Also support v1/v2 aliases
      v1: version1,
      v2: version2,
    }
  });
  return response.data;
};

/**
 * Restore a previous version
 * @param {string} resource - Resource type ('page' or 'section')
 * @param {string} id - Resource ID
 * @param {number} version - Version number to restore
 * @param {Object} data - Optional data (changeSummary)
 * @returns {Promise} - Response
 */
export const restoreVersion = async (resource, id, version, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/versions/${version}/restore`, data);
  return response.data;
};

