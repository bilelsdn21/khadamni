import api from './axios';

export const registerUser = (data) => api.post('/auth/register', data);

export const loginUser = (data) => api.post('/auth/login', data);

export const refreshToken = (token) =>
  api.post('/auth/refresh', { refresh_token: token });

export const logoutUser = () => api.post('/auth/logout');

export const verifyOtp = (data) => api.post('/auth/verify-otp', data);

export const removeDevices = () => api.post('/auth/remove-devices');
