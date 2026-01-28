import API from './api';

export const getAllEnquiries = async (params = {}) => {
  const response = await API.get('/enquiries', { params });
  return response.data;
};

export const getEnquiry = async (id) => {
  const response = await API.get(`/enquiries/${id}`);
  return response.data;
};

export const createEnquiry = async (data) => {
  const response = await API.post('/enquiries', data);
  return response.data;
};

export const updateEnquiry = async (id, data) => {
  const response = await API.put(`/enquiries/${id}`, data);
  return response.data;
};

export const deleteEnquiry = async (id) => {
  const response = await API.delete(`/enquiries/${id}`);
  return response.data;
};

export const markEnquiryRead = async (id) => {
  const response = await API.put(`/enquiries/${id}/mark-read`);
  return response.data;
};

export const markEnquiryReplied = async (id) => {
  const response = await API.put(`/enquiries/${id}/mark-replied`);
  return response.data;
};

export const archiveEnquiry = async (id) => {
  const response = await API.put(`/enquiries/${id}/archive`);
  return response.data;
};


