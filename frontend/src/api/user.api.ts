import { api } from "@/lib/axios";
import type { UserEntry } from "@/pages/Users";

export interface PageResponse<T> {
    items: T[];
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
}

export interface UserQuery {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
}

export const getUsers = async (
    params: UserQuery
): Promise<PageResponse<UserEntry>> => {

    const { data } = await api.get<PageResponse<UserEntry>>(
        "/users",
        {
            params
        }
    );

    return data;
};