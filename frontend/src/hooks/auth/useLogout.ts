import { authService } from '@/services/authService';
import { useMutation } from '@tanstack/react-query';

const useLogout = () => {
    return useMutation({
        mutationFn: authService.logout,
    });
};

export default useLogout;
