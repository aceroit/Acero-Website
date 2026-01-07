// src/services/api.js
import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.REACT_APP_API_URL || "http://localhost:4000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Add a request interceptor to attach token automatically
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
