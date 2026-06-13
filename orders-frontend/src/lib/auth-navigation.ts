import type {AuthUser} from "#/types/auth";
import type {NavigateFn} from "@tanstack/react-router";

export function roleHomePath(_user: AuthUser) {
    return "/";
}

export async function navigateToRoleHome(navigate: NavigateFn, user: AuthUser) {
    await navigate({to: roleHomePath(user), replace: true});
}
