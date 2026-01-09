import API from './api';

/**
 * Get all users with optional filters
 * @param {Object} params - Query parameters (page, limit, search, role, etc.)
 * @returns {Promise} - Response with users array
 */
export const getAllUsers = async (params = {}) => {
  const response = await API.get('/users', { params });
  return response.data;
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise} - Response with user data
 */
export const getUserById = async (id) => {
  const response = await API.get(`/users/${id}`);
  return response.data;
};

/**
 * Create new user
 * @param {Object} userData - User data (name, email, password, role)
 * @returns {Promise} - Response with created user
 */
export const createUser = async (userData) => {
  const response = await API.post('/users', userData);
  return response.data;
};

/**
 * Update user
 * @param {string} id - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise} - Response with updated user
 */
export const updateUser = async (id, userData) => {
  const response = await API.put(`/users/${id}`, userData);
  return response.data;
};

/**
 * Delete user (soft delete)
 * @param {string} id - User ID
 * @returns {Promise} - Response
 */
export const deleteUser = async (id) => {
  const response = await API.delete(`/users/${id}`);
  return response.data;
};

/**
 * Change user role
 * @param {string} id - User ID
 * @param {string} role - New role
 * @returns {Promise} - Response with updated user
 */
export const changeUserRole = async (id, role) => {
  const response = await API.put(`/users/${id}/role`, { role });
  return response.data;
};

/**
 * Get user statistics
 * @returns {Promise} - Response with user stats
 */
export const getUserStats = async () => {
  const response = await API.get('/users/stats');
  return response.data;
};

