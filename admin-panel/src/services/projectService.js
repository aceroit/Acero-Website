import API from './api';

/**
 * Get all projects (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, buildingType, country, region, area, industry, search, sortBy, sortOrder)
 * @returns {Promise} - Response with projects array
 */
export const getAllProjects = async (params = {}) => {
  const response = await API.get('/projects', { params });
  return response.data;
};

/**
 * Get project by ID
 * @param {string} id - Project ID
 * @returns {Promise} - Response with project data
 */
export const getProject = async (id) => {
  const response = await API.get(`/projects/${id}`);
  return response.data;
};

/**
 * Get project by slug
 * @param {string} slug - Project slug (jobNumberSlug)
 * @returns {Promise} - Response with project data
 */
export const getProjectBySlug = async (slug) => {
  const response = await API.get(`/projects/slug/${slug}`);
  return response.data;
};

/**
 * Create new project
 * @param {Object} projectData - Project data
 * @returns {Promise} - Response with created project
 */
export const createProject = async (projectData) => {
  const response = await API.post('/projects', projectData);
  return response.data;
};

/**
 * Update project
 * @param {string} id - Project ID
 * @param {Object} projectData - Project data to update
 * @returns {Promise} - Response with updated project
 */
export const updateProject = async (id, projectData) => {
  const response = await API.put(`/projects/${id}`, projectData);
  return response.data;
};

/**
 * Delete project (soft delete)
 * @param {string} id - Project ID
 * @returns {Promise} - Response
 */
export const deleteProject = async (id) => {
  const response = await API.delete(`/projects/${id}`);
  return response.data;
};

