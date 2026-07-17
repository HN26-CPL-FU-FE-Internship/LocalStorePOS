import { useContext } from 'react';
import AuthContext from '@/provider/AuthProvider/AuthContext';
import type { AuthContextType } from '@/provider/AuthProvider/AuthContext';

const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default useAuth;
