import axios from 'axios';
import { tokenUtils } from '@/utils/token';
import type { ApiResponse, LoginResponse } from '@/types/auth';

const BASE_URL = 'http://localhost:8080/restaurant-pos/api';

export const api = axios.create({
    baseURL: BASE_URL,
});

// ── State for refresh-token queue ──────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
}

// ── Request interceptor: attach access token ───────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = tokenUtils.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// ── Response interceptor: auto-refresh on 401 ──────────────────────────
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Not a 401, or already retried → reject immediately
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // Refresh endpoint itself failed → don't loop
        if (originalRequest.url?.endsWith('/auth/refresh')) {
            return Promise.reject(error);
        }

        const refreshToken = tokenUtils.getRefreshToken();
        if (!refreshToken) {
            tokenUtils.clearTokens();
            return Promise.reject(error);
        }

        // If a refresh is already in progress, queue this request
        if (isRefreshing) {
            return new Promise<string>((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((newToken) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const { data } = await axios.post<ApiResponse<LoginResponse>>(`${BASE_URL}/auth/refresh`, { refreshToken });

            const { accessToken, refreshToken: newRefreshToken } = data.result;

            tokenUtils.saveTokens({ accessToken, refreshToken: newRefreshToken });

            processQueue(null, accessToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            tokenUtils.clearTokens();
            window.location.href = '/restaurant-pos/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);
