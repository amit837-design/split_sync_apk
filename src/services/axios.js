import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Ensure you have setup babel.config.js for this to work
import { API_URL } from "@env";

// Fallback if .env fails (Optional, but good for debugging)
const BASE_URL = API_URL || "https://split-sync-backend-1.onrender.com";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// 1. Request Interceptor (Attach Token)
api.interceptors.request.use(
  async (config) => {
    try {
      const userInfoString = await AsyncStorage.getItem("userInfo");
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        // Handle both flat structure or nested user object
        const token = userInfo.token || userInfo.user?.token;

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error("Error reading token", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor (Handle 401/Logout)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("Session expired. Logging out...");
      // Clear storage
      await AsyncStorage.removeItem("userInfo");
      // UI navigation to login is handled by the AppNavigator observing the token
    }
    return Promise.reject(error);
  }
);

export default api;
