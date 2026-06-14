import { apiRequest, clearRequestSecurity } from "#/api/client";
import type { AuthUser, LoginRequest, RegisterRequest } from "#/types/auth";

export function getCurrentUser(signal?: AbortSignal) {
	return apiRequest<AuthUser>("/auth/me", { signal });
}

export function login(request: LoginRequest) {
	return apiRequest<AuthUser>("/auth/login", {
		method: "POST",
		body: request,
	});
}

export function register(request: RegisterRequest) {
	return apiRequest<AuthUser>("/auth/register", {
		method: "POST",
		body: request,
	});
}

export async function logout() {
	await apiRequest<void>("/auth/logout", { method: "POST" });
	clearRequestSecurity();
}
