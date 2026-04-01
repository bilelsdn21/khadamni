import api from './axios';

export const getPortfolio = (userId) => api.get(`/portfolio/${userId}`);
export const addPortfolioItem = (formData) => api.post('/portfolio/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deletePortfolioItem = (itemId) => api.delete(`/portfolio/${itemId}`);
