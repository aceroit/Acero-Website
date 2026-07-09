import API from './api';

const pendingAvailableActionsRequests = new Map();

/**
 * Workflow Service
 * Handles all workflow state transitions and actions
 */

export const submitForReview = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/submit`, data);
  return response.data;
};

export const markReviewed = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/review`, data);
  return response.data;
};

export const requestChanges = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/request-changes`, data);
  return response.data;
};

export const approveContent = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/approve`, data);
  return response.data;
};

export const rejectContent = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/reject`, data);
  return response.data;
};

export const publishContent = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/publish`, data);
  return response.data;
};

export const unpublishContent = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/unpublish`, data);
  return response.data;
};

export const archiveContent = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/archive`, data);
  return response.data;
};

export const restoreContent = async (resource, id, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/restore`, data);
  return response.data;
};

export const getAvailableActions = async (resource, id) => {
  const cacheKey = `${resource}:${id}`;

  if (!pendingAvailableActionsRequests.has(cacheKey)) {
    const request = API.get(`/workflow/${resource}/${id}/available-actions`)
      .then((response) => response.data)
      .finally(() => {
        pendingAvailableActionsRequests.delete(cacheKey);
      });

    pendingAvailableActionsRequests.set(cacheKey, request);
  }

  return pendingAvailableActionsRequests.get(cacheKey);
};
