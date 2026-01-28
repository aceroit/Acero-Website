import API from './api';

export const getAllVacancies = async (params = {}) => {
  const response = await API.get('/vacancies', { params });
  return response.data;
};

export const getVacancy = async (id) => {
  const response = await API.get(`/vacancies/${id}`);
  return response.data;
};

export const createVacancy = async (data) => {
  const response = await API.post('/vacancies', data);
  return response.data;
};

export const updateVacancy = async (id, data) => {
  const response = await API.put(`/vacancies/${id}`, data);
  return response.data;
};

export const deleteVacancy = async (id) => {
  const response = await API.delete(`/vacancies/${id}`);
  return response.data;
};


