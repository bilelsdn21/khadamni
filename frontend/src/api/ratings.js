import api from './axios';

export const getUserRatings = (userId) => api.get(`/ratings/user/${userId}`);
export const submitRating = (data) => api.post('/ratings/', data);
