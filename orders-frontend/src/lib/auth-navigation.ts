import type { NavigateFn } from "@tanstack/react-router";
import type { AuthUser } from "#/types/auth";

export function roleHomePath(_user: AuthUser) {
	return "/";
}

export async function navigateToRoleHome(navigate: NavigateFn, user: AuthUser) {
	await navigate({ to: roleHomePath(user), replace: true });
}
