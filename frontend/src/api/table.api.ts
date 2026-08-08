import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';
import type { Option } from '@/api/item.api';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
export type TableStatus = 'available' | 'booked' | 'occupied';
export type TableShape = 'ROUND' | 'RECTANGLE';
export type ReservationStatus = 'booked' | 'seated' | 'completed' | 'cancelled' | 'paid';

export interface TableEntry {
    id: number;
    tableNumber: string;
    areaId: number;
    areaName: string;
    seats: number;
    status: TableStatus;
    /** X coordinate of the table centre on the floor map (grid 0-1000). */
    xPosition: number | null;
    /** Y coordinate of the table centre on the floor map (grid 0-640). */
    yPosition: number | null;
    /** Table shape rendered on the floor map: ROUND | RECTANGLE. */
    shape: TableShape | null;
    createdAt: string;
    updatedAt: string;
}

export interface TableFormData {
    tableNumber: string;
    areaId: number;
    seats: number;
    status?: TableStatus;
    xPosition?: number | null;
    yPosition?: number | null;
    shape?: TableShape;
}

export interface ReservationEntry {
    id: number;
    customerId: number;
    customerName: string;
    customerPhone: string;
    tableId: number;
    tableNumber: string;
    reservationTime: string;
    guests: number;
    status: ReservationStatus;
    notes: string | null;
    createdAt: string;
}

export interface ReservationFormData {
    customerId: number;
    tableId: number;
    reservationTime: string;
    guests: number;
    notes?: string;
    status?: ReservationStatus;
}

/* ------------------------------------------------------------------ */
/*  Table Areas                                                       */
/* ------------------------------------------------------------------ */
export const getTableAreas = async (): Promise<Option[]> => {
    const { data } = await api.get<ApiResponse<Option[]>>('/table-areas');
    return data.result;
};

export const createTableArea = async (name: string): Promise<Option> => {
    const { data } = await api.post<ApiResponse<Option>>('/table-areas', { name });
    return data.result;
};

export const deleteTableArea = async (id: number): Promise<void> => {
    await api.delete(`/table-areas/${id}`);
};

/* ------------------------------------------------------------------ */
/*  Tables                                                            */
/* ------------------------------------------------------------------ */
export const getTables = async (params: { areaId?: number; status?: TableStatus }): Promise<TableEntry[]> => {
    const { data } = await api.get<ApiResponse<TableEntry[]>>('/tables', { params });
    return data.result;
};

export const createTable = async (payload: TableFormData): Promise<TableEntry> => {
    const { data } = await api.post<ApiResponse<TableEntry>>('/tables', payload);
    return data.result;
};

export const updateTable = async (id: number, payload: TableFormData): Promise<TableEntry> => {
    const { data } = await api.put<ApiResponse<TableEntry>>(`/tables/${id}`, payload);
    return data.result;
};

export const updateTableStatus = async (id: number, status: TableStatus): Promise<TableEntry> => {
    const { data } = await api.patch<ApiResponse<TableEntry>>(`/tables/${id}/status`, null, { params: { status } });
    return data.result;
};

export const deleteTable = async (id: number): Promise<void> => {
    await api.delete(`/tables/${id}`);
};

/* ------------------------------------------------------------------ */
/*  Reservations                                                      */
/* ------------------------------------------------------------------ */
export const getReservations = async (params: {
    tableId?: number;
    status?: ReservationStatus;
}): Promise<ReservationEntry[]> => {
    const { data } = await api.get<ApiResponse<ReservationEntry[]>>('/reservations', { params });
    return data.result;
};

export const createReservation = async (payload: ReservationFormData): Promise<ReservationEntry> => {
    const { data } = await api.post<ApiResponse<ReservationEntry>>('/reservations', payload);
    return data.result;
};

export const updateReservation = async (
    id: number,
    payload: ReservationFormData,
): Promise<ReservationEntry> => {
    const { data } = await api.put<ApiResponse<ReservationEntry>>(`/reservations/${id}`, payload);
    return data.result;
};

export const updateReservationStatus = async (
    id: number,
    status: ReservationStatus,
): Promise<ReservationEntry> => {
    const { data } = await api.patch<ApiResponse<ReservationEntry>>(`/reservations/${id}/status`, null, {
        params: { status },
    });
    return data.result;
};

export const deleteReservation = async (id: number): Promise<void> => {
    await api.delete(`/reservations/${id}`);
};
