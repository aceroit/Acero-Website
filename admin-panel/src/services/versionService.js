import API from './api';

/**
 * Version Service
 * Handles content versioning operations across workflow-enabled resources.
 */

export const getVersionHistory = async (resource, id, params = {}) => {
  const response = await API.get(`/workflow/${resource}/${id}/versions`, { params });
  return response.data;
};

export const getVersion = async (resource, id, version) => {
  const response = await API.get(`/workflow/${resource}/${id}/versions`, {
    params: { version },
  });
  return response.data;
};

export const compareVersions = async (resource, id, version1, version2) => {
  const response = await API.get(`/workflow/${resource}/${id}/versions/compare`, {
    params: {
      version1,
      version2,
      v1: version1,
      v2: version2,
    },
  });
  return response.data;
};

export const compareLiveDraft = async (resource, id) => {
  const response = await API.get(`/workflow/${resource}/${id}/compare-live-draft`);
  return response.data;
};

export const restoreVersion = async (resource, id, version, data = {}) => {
  const response = await API.post(`/workflow/${resource}/${id}/versions/${version}/restore`, data);
  return response.data;
};
