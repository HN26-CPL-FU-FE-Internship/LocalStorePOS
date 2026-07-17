import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/lib/axios';
import { tokenUtils } from '@/utils/token';
import type { ApiResponse } from '@/types/auth';
import type { PermissionModule, UserInfo } from '@/types/permission';
import AuthContext from './AuthContext';

interface AuthProviderProps {
    children: ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch current user on mount if token exists
    useEffect(() => {
        const fetchUser = async () => {
            const token = tokenUtils.getAccessToken();
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const { data } = await api.get<ApiResponse<UserInfo>>('/auth/me');
                setUser(data.result);
            } catch {
                // Token is invalid or expired — auto-refresh interceptor handles redirect
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, []);

    const logout = useCallback(() => {
        const refreshToken = tokenUtils.getRefreshToken();
        if (refreshToken) {
            api.post('/auth/logout', { refreshToken }).catch(() => {});
        }
        tokenUtils.clearTokens();
        setUser(null);
        window.location.href = '/restaurant-pos/login';
    }, []);

    const hasPermission = useCallback(
        (module: string, action: 'view' | 'add' | 'edit' | 'delete' | 'export' | 'approvedVoid'): boolean => {
            if (!user) return false;

            const perm = user.permissions.find((p: PermissionModule) => p.module === module);
            if (!perm) return false;

            switch (action) {
                case 'view':
                    return perm.view;
                case 'add':
                    return perm.add;
                case 'edit':
                    return perm.edit;
                case 'delete':
                    return perm.delete_;
                case 'export':
                    return perm.export_;
                case 'approvedVoid':
                    return perm.approvedVoid;
                default:
                    return false;
            }
        },
        [user],
    );

    const canView = useCallback(
        (module: string): boolean => {
            return hasPermission(module, 'view');
        },
        [hasPermission],
    );

    const value = useMemo(
        () => ({
            user,
            isAuthenticated: !!user,
            isLoading,
            setUser,
            logout,
            hasPermission,
            canView,
        }),
        [user, isLoading, logout, hasPermission, canView],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
