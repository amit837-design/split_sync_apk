import api from "./axios";

// Access (Create/Get) 1-on-1 Chat
export const accessChatApi = (userId) => {
  return api.post("/chat/access", { userId });
};

// Fetch all chats (Main list)
export const fetchChatsApi = () => {
  return api.get("/chat/fetch");
};

// Create Group
export const createGroupChatApi = (data) => {
  return api.post("/chat/group", data);
};

// Exit Group (Remove Self)
export const exitGroupApi = (chatId, userId) => {
  return api.put("/chat/groupremove", { chatId, userId });
};

// Update Group (Name, Pic, etc.)
// ⚠️ MOBILE NOTE: When sending images via formData in React Native,
// the file object must look like: { uri: '...', type: 'image/jpeg', name: 'photo.jpg' }
export const updateGroupDetailsApi = (formData) => {
  return api.put("/chat/groupupdate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Search Users
export const searchUsersApi = (queryParams) => {
  // Case 1: Object format
  if (typeof queryParams === "object") {
    return api.get("/chat/users/search", { params: queryParams });
  }
  // Case 2: String format
  return api.get(`/chat/users/search?search=${queryParams}`);
};
