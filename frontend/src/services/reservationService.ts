import type { ReservationEntry, ReservationStatus } from '@/api/table.api';
import { api } from '@/lib';
import type { ApiResponse } from '@/types/auth';

const reservationService = {
    getReservations: async (params: { tableId?: number; status?: ReservationStatus }): Promise<ReservationEntry[]> => {
        const { data } = await api.get<ApiResponse<ReservationEntry[]>>('/reservations', { params });
        return data.result;
    },
};

export default reservationService;
