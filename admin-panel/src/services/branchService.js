import API from './api';

/**
 * Get all branches (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, country, state, city, isHeadOffice, search, sortBy, sortOrder)
 * @returns {Promise} - Response with branches array
 */
export const getAllBranches = async (params = {}) => {
  const response = await API.get('/branches', { params });
  return response.data;
};

/**
 * Get branch by ID
 * @param {string} id - Branch ID
 * @returns {Promise} - Response with branch data
 */
export const getBranch = async (id) => {
  const response = await API.get(`/branches/${id}`);
  return response.data;
};

/**
 * Create new branch
 * @param {Object} branchData - Branch data
 * @returns {Promise} - Response with created branch
 */
export const createBranch = async (branchData) => {
  const response = await API.post('/branches', branchData);
  return response.data;
};

/**
 * Update branch
 * @param {string} id - Branch ID
 * @param {Object} branchData - Branch data to update
 * @returns {Promise} - Response with updated branch
 */
export const updateBranch = async (id, branchData) => {
  const response = await API.put(`/branches/${id}`, branchData);
  return response.data;
};

/**
 * Delete branch (soft delete)
 * @param {string} id - Branch ID
 * @returns {Promise} - Response
 */
export const deleteBranch = async (id) => {
  const response = await API.delete(`/branches/${id}`);
  return response.data;
};

/**
 * Reorder branches (bulk update order values)
 * @param {Array<{ branchId: string, order: number }>} branchOrders - Array of { branchId, order }
 * @returns {Promise} - Response
 */
export const reorderBranches = async (branchOrders) => {
  const response = await API.put('/branches/reorder', { branchOrders });
  return response.data;
};