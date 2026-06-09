import axios from "axios";

const axiosInstance = axios.create({
  timeout: 10000,
  baseURL: "http://localhost:8088" 
});

// Request Interceptor - Adds JWT token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Handles token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;