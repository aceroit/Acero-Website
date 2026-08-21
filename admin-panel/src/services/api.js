// src/services/api.js
import axios from "axios";

// Shared Axios client for the admin panel. All admin services import this so
// token refresh, permission errors, and the VITE_API_URL base stay consistent.
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
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

    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
        if (typeof config.headers?.delete === "function") {
            config.headers.delete("Content-Type");
        } else if (config.headers) {
            delete config.headers["Content-Type"];
            delete config.headers["content-type"];
        }
    }

    return config;
});

// Add a response interceptor for error handling
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized - Token expired or invalid
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh token
                const token = localStorage.getItem("token");
                if (token) {
                    const refreshResponse = await axios.post(
                        `${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/auth/refresh-token`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );

                    const newToken = refreshResponse.data.data.token;
                    localStorage.setItem("token", newToken);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return API(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("permissions");
                
                // Redirect to login if not already there
                if (window.location.pathname !== "/") {
                    window.location.href = "/";
                }
                return Promise.reject(refreshError);
            }
        }

        // Handle 403 Forbidden - Permission denied
        if (error.response?.status === 403) {
            // You can show a toast notification here if needed
            console.error("Permission denied");
        }

        return Promise.reject(error);
    }
);

export default API;
