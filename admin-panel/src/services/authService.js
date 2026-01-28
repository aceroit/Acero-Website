import API from './api';

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} - Response with token and user data
 */
export const login = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Logout user
 * @returns {Promise} - Response
 */
export const logout = async () => {
  const response = await API.post('/auth/logout');
  return response.data;
};

/**
 * Get current authenticated user
 * @returns {Promise} - Response with user data
 */
export const getCurrentUser = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};

/**
 * Refresh JWT token
 * @returns {Promise} - Response with new token
 */
export const refreshToken = async () => {
  const response = await API.post('/auth/refresh-token');
  return response.data;
};

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise} - Response with user data and token
 */
export const register = async (userData) => {
  const response = await API.post('/auth/register', userData);
  return response.data;
};

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise} - Response with updated user data
 */
export const updateProfile = async (profileData) => {
  const response = await API.put('/auth/profile', profileData);
  return response.data;
};

/**
 * Change user password
 * @param {Object} passwordData - Current and new password
 * @returns {Promise} - Response
 */
export const changePassword = async (passwordData) => {
  const response = await API.put('/auth/change-password', passwordData);
  return response.data;
};

