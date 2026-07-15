export type Status = "Active" | "Inactive";
export interface UserEntry {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
    phone: string;
    email: string;
    status: Status
    avatarKey: string; // key into userImages
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