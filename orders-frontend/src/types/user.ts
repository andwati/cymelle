import type {Role} from "#/types/auth";

export type UserSummary = {
    id: string;
    username: string;
    displayName: string;
    role: Role;
    enabled: boolean;
    createdAt: string;
};

export type AdminUserRequest = {
    username: string;
    displayName: string;
    password?: string;
    role: Role;
    enabled: boolean;
};
