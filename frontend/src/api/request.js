import api from './axios';

export const createRequest = (data) => api.post('/requests/', data);
export const getMyRequests = () => api.get('/requests/my');
export const acceptRequest = (id) => api.post(`/requests/${id}/accept`);
export const rejectRequest = (id) => api.post(`/requests/${id}/reject`);
