import api from './axios';

export const getUserRatings = (userId) => api.get(`/ratings/user/${userId}`);
export const getJobRatings = (jobId) => api.get(`/ratings/job/${jobId}`);
export const submitRating = (data) => api.post('/ratings/', data);
