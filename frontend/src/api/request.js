import api from './axios';

export const createRequest = (data) => api.post('/requests/', data);
export const getMyRequests = () => api.get('/requests/my');
export const getRequestById = (id) => api.get(`/requests/${id}`);
export const acceptRequest = (id) => api.post(`/requests/${id}/accept`);
export const rejectRequest = (id) => api.post(`/requests/${id}/reject`);
export const completeRequest = (id) => api.post(`/requests/${id}/complete`);
export const cancelRequest = (id) => api.post(`/requests/${id}/cancel`);
