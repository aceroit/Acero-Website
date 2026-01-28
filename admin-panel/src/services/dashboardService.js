import API from './api';

/**
 * Get workflow metrics overview
 * @returns {Promise} - Response with workflow metrics
 */
export const getWorkflowMetrics = async () => {
  const response = await API.get('/dashboard/metrics');
  return response.data;
};

/**
 * Get user's workload summary
 * @returns {Promise} - Response with workload summary
 */
export const getUserWorkloadSummary = async () => {
  const response = await API.get('/dashboard/workload');
  return response.data;
};

/**
 * Get user's draft content
 * @returns {Promise} - Response with draft content
 */
export const getMyDrafts = async () => {
  const response = await API.get('/dashboard/my-drafts');
  return response.data;
};

/**
 * Get user's submissions in workflow
 * @returns {Promise} - Response with submissions
 */
export const getMySubmissions = async () => {
  const response = await API.get('/dashboard/my-submissions');
  return response.data;
};

/**
 * Get recently published content
 * @returns {Promise} - Response with recently published content
 */
export const getRecentlyPublished = async () => {
  const response = await API.get('/dashboard/recently-published');
  return response.data;
};

/**
 * Get pending items awaiting user action
 * @returns {Promise} - Response with pending items
 */
export const getPendingItems = async () => {
  const response = await API.get('/dashboard/pending');
  return response.data;
};

/**
 * Get team activity feed
 * @param {number} limit - Maximum number of activities to return
 * @returns {Promise} - Response with team activities
 */
export const getTeamActivity = async (limit = 50) => {
  const response = await API.get('/dashboard/team-activity', {
    params: { limit }
  });
  return response.data;
};

/**
 * Get workflow bottlenecks (admin only)
 * @returns {Promise} - Response with bottleneck data
 */
export const getBottlenecks = async () => {
  const response = await API.get('/dashboard/bottlenecks');
  return response.data;
};

