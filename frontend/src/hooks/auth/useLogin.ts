import { authService } from '@/services/authService';
import { useMutation } from '@tanstack/react-query';

const useLogin = () => {
    return useMutation({
        mutationFn: authService.login,
    });
};

export default useLogin;
