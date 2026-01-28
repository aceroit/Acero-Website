import API from './api';

export const getAllFormConfigurations = async (params = {}) => {
  const response = await API.get('/form-configurations', { params });
  return response.data;
};

export const getActiveFormConfiguration = async () => {
  const response = await API.get('/form-configurations/active');
  return response.data;
};

export const createFormConfiguration = async (data) => {
  const response = await API.post('/form-configurations', data);
  return response.data;
};

export const updateFormConfiguration = async (id, data) => {
  const response = await API.put(`/form-configurations/${id}`, data);
  return response.data;
};

export const deleteFormConfiguration = async (id) => {
  const response = await API.delete(`/form-configurations/${id}`);
  return response.data;
};


