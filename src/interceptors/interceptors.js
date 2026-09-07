import { api } from "./api";
import { clearAccessToken, getAccessToken, setAccessToken } from "../dep/token";
import axios, { type InternalAxiosRequestConfig } from "axios";


let isRefreshing = false;
let failedQueue: any[] = [];


const processQueue = (error?: any) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        }else {
            prom.resolve();
        }
    });
    failedQueue = [];
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.withCredentials = true;
    return config;
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (originalRequest?.url?.includes("/auth/signin")){
            return Promise.reject(error);
        }
        if (originalRequest?.url?.includes("/auth/reset_password")){
            return Promise.reject(error);
        }
        if (error.response?.status === 400) {
            return Promise.reject(error)
        }
        if (
            originalRequest?._retry ||
            originalRequest?.skipAuth ||
            originalRequest?.url?.includes("/auth/logout") ||
            originalRequest?.url?.includes("/auth/refresh_access")
        ) {
            return Promise.reject(error);
        }
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({resolve, reject})
            }).then(() => {
                return api(originalRequest);
            })
        }
        if (error.response?.status === 401 || originalRequest?._retry) {
            return Promise.reject(error);
        }
        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const res = await api.post(
                "/auth/refresh_access",
                {},
                { withCredentials: true }
            )
            processQueue(null);

            return api(originalRequest);
        } catch (err){

            processQueue(err);
            clearAccessToken();
            return Promise.reject(err);
        } finally {
            isRefreshing = false;
        }
    }
);