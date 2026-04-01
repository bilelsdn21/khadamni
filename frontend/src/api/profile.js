import api from './axios';

export const getProfile = () => api.get('/profile/me');
export const updateProfile = (data) => api.put('/profile/me', data);
export const getPublicProfileById = (id) => api.get(`/providers/${id}`);
