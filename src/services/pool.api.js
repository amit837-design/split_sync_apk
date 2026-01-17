import api from "./axios";

// 1. Create a new expense pool
export const createPoolApi = (data) => {
  return api.post("/api/pools/create-pool", data);
};

// 2. Update status (e.g., Borrower clicks "Paid")
export const updatePoolStatusApi = (data) => {
  return api.patch("/api/pools/update-status", data);
};

// 3. Fetch Dashboard Data
export const getDashboardDataApi = () => {
  return api.get("/api/pools/dashboard");
};

// 4. Fetch balance with specific user
export const getFriendBalanceApi = (friendId) => {
  return api.get(`/api/pools/balance/${friendId}`);
};