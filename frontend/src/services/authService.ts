import { api } from '@/lib/axios';
import type { LoginForm } from '@/pages/Login/login.schema';
import type { LoginResponse, ApiResponse, RefreshTokenRequest } from '@/types/auth';

export const authService = {
    login: (data: LoginForm) => {
        return api.post<ApiResponse<LoginResponse>>('/auth/login', data);
    },

    logout: (refreshToken: string) => {
        return api.post('/auth/logout', { refreshToken });
    },

    refreshToken: (data: RefreshTokenRequest) => {
        api.post<ApiResponse<LoginResponse>>('/auth/refresh', data);
    },
};
