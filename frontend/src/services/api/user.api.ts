import { api } from '@/lib/axios';
import type { PageResponse, UserCreateRequest, UserEntry, UserQuery, UserUpdateRequest } from '@/types/user';

const USER_ENDPOINT = '/users';

export const getUsers = async (query?: UserQuery): Promise<PageResponse<UserEntry>> => {
    const params: Record<string, string | number> = {
        page: query?.page ?? 0,
        size: query?.size ?? 50,
        sortBy: query?.sortBy ?? 'createdAt',
        sortDir: query?.sortDir ?? 'desc',
    };
    const { data } = await api.get<PageResponse<UserEntry>>(USER_ENDPOINT, { params });
    return data;
};

export const getUserById = async (id: number): Promise<UserEntry> => {
    const { data } = await api.get<UserEntry>(`${USER_ENDPOINT}/${id}`);
    return data;
};

export const createUser = async (request: UserCreateRequest, avatarFile?: File): Promise<UserEntry> => {
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(request)], { type: 'application/json' });
    formData.append('user', blob);
    if (avatarFile) {
        formData.append('avatar', avatarFile);
    }
    const { data } = await api.post<UserEntry>(USER_ENDPOINT, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const updateUser = async (
    id: number,
    request: UserUpdateRequest,
    avatarFile?: File
): Promise<UserEntry> => {
    const formData = new FormData();

    formData.append(
        "user",
        new Blob(
            [JSON.stringify(request)],
            { type: "application/json" }
        )
    );

    if (avatarFile) {
        formData.append("avatar", avatarFile);
    }

    const { data } = await api.put<UserEntry>(
        `${USER_ENDPOINT}/${id}`,
        formData
    );

    return data;
};

export const deleteUser = async (id: number): Promise<void> => {
    await api.delete(`${USER_ENDPOINT}/${id}`);
};