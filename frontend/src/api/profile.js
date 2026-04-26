import api from './axios';

export const getProfile = () => api.get('/profile/me');
export const updateProfile = (data) => api.put('/profile/me', data);
export const getPublicProfileById = (id) => api.get(`/providers/${id}`);
export const getPublicUserById = (id) => api.get(`/profile/user/${id}/public`);
export const uploadAvatar = (formData) => api.post('/profile/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const changePassword = (data) => api.post('/profile/me/password', data);
