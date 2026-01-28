import API from './api';

/**
 * Get all customers (with optional filters and pagination)
 * @param {Object} params - Query parameters (page, limit, status, search, sortBy, sortOrder)
 * @returns {Promise} - Response with customers array
 */
export const getAllCustomers = async (params = {}) => {
  const response = await API.get('/customers', { params });
  return response.data;
};

/**
 * Get customer by ID
 * @param {string} id - Customer ID
 * @returns {Promise} - Response with customer data
 */
export const getCustomer = async (id) => {
  const response = await API.get(`/customers/${id}`);
  return response.data;
};

/**
 * Create new customer
 * @param {Object} customerData - Customer data
 * @returns {Promise} - Response with created customer
 */
export const createCustomer = async (customerData) => {
  const response = await API.post('/customers', customerData);
  return response.data;
};

/**
 * Update customer
 * @param {string} id - Customer ID
 * @param {Object} customerData - Customer data to update
 * @returns {Promise} - Response with updated customer
 */
export const updateCustomer = async (id, customerData) => {
  const response = await API.put(`/customers/${id}`, customerData);
  return response.data;
};

/**
 * Delete customer (soft delete)
 * @param {string} id - Customer ID
 * @returns {Promise} - Response
 */
export const deleteCustomer = async (id) => {
  const response = await API.delete(`/customers/${id}`);
  return response.data;
};

