import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/auth';
import type { PageResponse, UserCreateRequest, UserEntry, UserQuery, UserUpdateRequest } from '@/types/user';

const USER_ENDPOINT = '/users';

export const getUsers = async (query?: UserQuery): Promise<PageResponse<UserEntry>> => {
    const params: Record<string, string | number | undefined> = {
        page: query?.page ?? 0,
        size: query?.size ?? 50,
        sortBy: query?.sortBy ?? 'createdAt',
        sortDir: query?.sortDir ?? 'desc',
        search: query?.search || undefined,
        status: query?.status || undefined,
        roleIds: query?.roleIds || undefined,
    };
    // Remove undefined values so they aren't sent as query params
    Object.keys(params).forEach((key) => {
        if (params[key] === undefined) {
            delete params[key];
        }
    });
    const { data } = await api.get<ApiResponse<PageResponse<UserEntry>>>(USER_ENDPOINT, { params });
    return data.result;
};

export const getUserById = async (id: number): Promise<UserEntry> => {
    const { data } = await api.get<ApiResponse<UserEntry>>(`${USER_ENDPOINT}/${id}`);
    return data.result;
};

export const createUser = async (request: UserCreateRequest, avatarFile?: File): Promise<UserEntry> => {
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(request)], { type: 'application/json' });
    formData.append('user', blob);
    if (avatarFile) {
        formData.append('avatar', avatarFile);
    }
    const { data } = await api.post<ApiResponse<UserEntry>>(USER_ENDPOINT, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.result;
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

    const { data } = await api.put<ApiResponse<UserEntry>>(
        `${USER_ENDPOINT}/${id}`,
        formData
    );

    return data.result;
};

export const deleteUser = async (id: number): Promise<void> => {
    await api.delete(`${USER_ENDPOINT}/${id}`);
};

/* ---------- User Permission Overrides ---------- */

export interface UserPermissionsResponse {
    userId: number;
    userName: string;
    permissions: PermissionModuleResponse[];
}

export interface PermissionModuleResponse {
    module: string;
    view: boolean;
    add: boolean;
    edit: boolean;
    delete_: boolean;
    export_: boolean;
    approvedVoid: boolean;
}

export const getUserPermissions = async (userId: number): Promise<UserPermissionsResponse> => {
    const { data } = await api.get<ApiResponse<UserPermissionsResponse>>(
        `${USER_ENDPOINT}/${userId}/permissions`,
    );
    return data.result;
};

export const updateUserPermissions = async (
    userId: number,
    permissions: PermissionModuleResponse[],
): Promise<void> => {
    await api.put(`${USER_ENDPOINT}/${userId}/permissions`, { permissions });
};