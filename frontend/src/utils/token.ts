import type { AuthTokens } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenUtils = {
    saveTokens(tokens: AuthTokens) {
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    },

    getAccessToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    },

    getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    clearTokens() {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },

    isLoggedIn(): boolean {
        return !!localStorage.getItem(ACCESS_TOKEN_KEY);
    },
};
