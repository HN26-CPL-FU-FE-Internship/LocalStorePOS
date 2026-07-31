import { RESERVATION_QUERY_KEYS } from '@/constants';
import reservationService from '@/services/reservationService';
import { useQuery } from '@tanstack/react-query';

const useGetReservation = () => {
    return useQuery({
        queryKey: RESERVATION_QUERY_KEYS.all,
        queryFn: () => reservationService.getReservations({}),
    });
};

export default useGetReservation;
