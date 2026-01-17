import api from "./axios";

// Redundant search (same as chat.api.js), but kept for compatibility
export const searchUsersApi = (params) => {
  return api.get("/chat/users/search", { params });
};
