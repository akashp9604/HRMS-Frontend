import axiosInstance from "./axiosConfig";

const API = axiosInstance.create({
  baseURL: "http://localhost:8088/api/employees",
});

// Always attach fresh credentials from localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//  Add response interceptor for handling token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
