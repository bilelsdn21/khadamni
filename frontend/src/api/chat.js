import api from './axios';

export const getChatRoom = (requestId) => {
  return api.get(`/chat/${requestId}`);
};

export const getChatMessages = (requestId, page = 1, perPage = 50) => {
  return api.get(`/chat/${requestId}/messages`, { params: { page, per_page: perPage } });
};

export const sendOffer = (requestId, amount, note = '') => {
  return api.post(`/chat/${requestId}/offer`, { amount, note });
};

export const updateOfferStatus = (requestId, messageId, status) => {
  return api.patch(`/chat/${requestId}/offer/${messageId}`, { status });
};

export const confirmAgreement = (requestId) => {
  return api.patch(`/chat/${requestId}/confirm`);
};

export const cancelRequest = (requestId) => {
  return api.patch(`/chat/${requestId}/cancel`);
};
