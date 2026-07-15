export type Status = 'active' | 'inactive';

export interface UserEntry {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
    phoneNumber: string;
    email: string;
    status: Status;
    avatarPath: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UserCreateRequest {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: number;
    avatarPath?: string;
}

export interface UserUpdateRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
    role?: number;
    status?: Status;
}

export interface PermissionModule {
    module: string;
    view: boolean;
    add: boolean;
    edit: boolean;
    delete_: boolean;
    export_: boolean;
    approvedVoid: boolean;
}

export interface PageResponse<T> {
    items: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

export interface UserQuery {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
}