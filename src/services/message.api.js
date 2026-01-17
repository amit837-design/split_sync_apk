import api from "./axios";

// Fetch all messages of a chat
export const fetchMessagesApi = (chatId) => {
  return api.get(`/api/messages/${chatId}`);
};

// Send a new message
export const sendMessageApi = ({ chatId, content }) => {
  return api.post("/api/messages", { chatId, content });
};