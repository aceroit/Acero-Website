import API from './api';

/**
 * Upload media file(s)
 * @param {File|File[]} files - Single file or array of files
 * @param {Object} options - Upload options (folder, tags, description, altText)
 * @returns {Promise} - Response with uploaded media
 */
export const uploadMedia = async (files, options = {}) => {
  const formData = new FormData();
  
  // Handle single file or array of files
  if (Array.isArray(files)) {
    files.forEach((file) => {
      formData.append('files', file);
    });
  } else {
    formData.append('file', files);
  }
  
  // Add optional fields
  if (options.folder) formData.append('folder', options.folder);
  if (options.tags) formData.append('tags', options.tags);
  if (options.description) formData.append('description', options.description);
  if (options.altText) formData.append('altText', options.altText);

  const response = await API.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Get all media (with filters and pagination)
 * @param {Object} params - Query parameters
 * @returns {Promise} - Response with media array
 */
export const getAllMedia = async (params = {}) => {
  const response = await API.get('/media', { params });
  return response.data;
};

/**
 * Get media by ID
 * @param {string} id - Media ID
 * @returns {Promise} - Response with media data
 */
export const getMediaById = async (id) => {
  const response = await API.get(`/media/${id}`);
  return response.data;
};

/**
 * Update media metadata
 * @param {string} id - Media ID
 * @param {Object} data - Update data
 * @returns {Promise} - Response with updated media
 */
export const updateMedia = async (id, data) => {
  const response = await API.put(`/media/${id}`, data);
  return response.data;
};

/**
 * Delete media
 * @param {string} id - Media ID
 * @returns {Promise} - Response
 */
export const deleteMedia = async (id) => {
  const response = await API.delete(`/media/${id}`);
  return response.data;
};

/**
 * Search media
 * @param {Object} params - Search parameters
 * @returns {Promise} - Response with media array
 */
export const searchMedia = async (params = {}) => {
  const response = await API.get('/media/search', { params });
  return response.data;
};

/**
 * Get media by folder
 * @param {string} folder - Folder path (e.g., "projects/thumbnails")
 * @param {Object} params - Query parameters (page, limit, sortBy, sortOrder)
 * @returns {Promise} - Response with media array
 */
export const getMediaByFolder = async (folder, params = {}) => {
  const response = await API.get(`/media/folder/${encodeURIComponent(folder)}`, { params });
  return response.data;
};

