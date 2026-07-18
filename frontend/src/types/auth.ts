export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface ApiResponse<T> {
    code: number;
    message: string;
    result: T;
    errors?: Record<string, string>;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
