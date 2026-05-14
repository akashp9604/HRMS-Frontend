// src/apis/employeeApi.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8088/api/employees",
});

// Always attach fresh credentials from localStorage
API.interceptors.request.use((config) => {
  const authData = JSON.parse(localStorage.getItem("authUser")) || {};
  if (authData.username && authData.password) {
    config.auth = {
      username: authData.username,
      password: authData.password,
    };
  }
  return config;
});

export default API;
