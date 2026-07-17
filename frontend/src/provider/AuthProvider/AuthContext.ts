import { createContext } from 'react';
import type { UserInfo } from '@/types/permission';

export interface AuthContextType {
    user: UserInfo | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: UserInfo) => void;
    logout: () => void;
    /** Check if user has a specific permission for a module */
    hasPermission: (module: string, action: 'view' | 'add' | 'edit' | 'delete' | 'export' | 'approvedVoid') => boolean;
    /** Check if user has view permission for a module (used for sidebar/routing) */
    canView: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
