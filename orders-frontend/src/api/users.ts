import {apiRequest} from "#/api/client";
import type {AdminUserRequest, UserSummary} from "#/types/user";

export function getUsers(signal?: AbortSignal) {
    return apiRequest<UserSummary[]>("/users", {signal});
}

export function getCustomers(signal?: AbortSignal) {
    return apiRequest<UserSummary[]>("/users/customers", {signal});
}

export function getDrivers(signal?: AbortSignal) {
    return apiRequest<UserSummary[]>("/users/drivers", {signal});
}

export function createUser(request: AdminUserRequest) {
    return apiRequest<UserSummary>("/users", {
        method: "POST",
        body: request,
    });
}

export function updateUser(id: string, request: AdminUserRequest) {
    return apiRequest<UserSummary>(`/users/${id}`, {
        method: "PUT",
        body: request,
    });
}

export function disableUser(id: string) {
    return apiRequest<UserSummary>(`/users/${id}`, {method: "DELETE"});
}
