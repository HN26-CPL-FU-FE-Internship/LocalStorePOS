import { POS_QUERY_KEYS } from '@/constants/pos';
import { queryClient } from '@/lib';
import posService from '@/services/posService';
import type { OptionItem } from '@/services/posService';
import { useMutation } from '@tanstack/react-query';

export interface CreateCustomerData {
    name: string;
    phone: string;
    email?: string;
    gender?: 'male' | 'female' | 'other' | null;
}

const useCreateCustomer = () => {
    return useMutation<OptionItem, Error, CreateCustomerData>({
        mutationFn: (data: CreateCustomerData) => posService.createCustomer(data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: POS_QUERY_KEYS.customers(),
            });
        },
    });
};

export default useCreateCustomer;
