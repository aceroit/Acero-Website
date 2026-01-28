import api from './api';

/**
 * Get all media with filters and pagination
 */
export const getAllMedia = async (params = {}) => {
  try {
    const response = await api.get('/media-library', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching media:', error);
    throw error;
  }
};

/**
 * Get single media by ID
 */
export const getMediaById = async (id) => {
  try {
    const response = await api.get(`/media-library/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching media by ID:', error);
    throw error;
  }
};

/**
 * Create new media (file upload or YouTube link)
 */
export const createMedia = async (data) => {
  try {
    const response = await api.post('/media-library', data);
    return response.data;
  } catch (error) {
    console.error('Error creating media:', error);
    throw error;
  }
};

/**
 * Update media
 */
export const updateMedia = async (id, data) => {
  try {
    const response = await api.put(`/media-library/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating media:', error);
    throw error;
  }
};

/**
 * Delete media
 */
export const deleteMedia = async (id) => {
  try {
    const response = await api.delete(`/media-library/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
};

/**
 * Get folders list
 */
export const getFolders = async () => {
  try {
    const response = await api.get('/media-library/folders');
    return response.data;
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

/**
 * Bulk delete media
 */
export const bulkDeleteMedia = async (ids) => {
  try {
    const response = await api.post('/media-library/bulk-delete', { ids });
    return response.data;
  } catch (error) {
    console.error('Error bulk deleting media:', error);
    throw error;
  }
};
