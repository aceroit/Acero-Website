import API from './api';

export const getAllApplications = async (params = {}) => {
  const response = await API.get('/applications', { params });
  return response.data;
};

export const getApplication = async (id) => {
  const response = await API.get(`/applications/${id}`);
  return response.data;
};

export const createApplication = async (data) => {
  const response = await API.post('/applications', data);
  return response.data;
};

export const updateApplication = async (id, data) => {
  const response = await API.put(`/applications/${id}`, data);
  return response.data;
};

export const deleteApplication = async (id) => {
  const response = await API.delete(`/applications/${id}`);
  return response.data;
};

export const markReviewing = async (id) => {
  const response = await API.put(`/applications/${id}/mark-reviewing`);
  return response.data;
};

export const shortlistApplication = async (id) => {
  const response = await API.put(`/applications/${id}/shortlist`);
  return response.data;
};

export const rejectApplication = async (id) => {
  const response = await API.put(`/applications/${id}/reject`);
  return response.data;
};

export const archiveApplication = async (id) => {
  const response = await API.put(`/applications/${id}/archive`);
  return response.data;
};


