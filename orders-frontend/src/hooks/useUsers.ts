import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createUser,
	disableUser,
	getCustomers,
	getDrivers,
	getUsers,
	updateUser,
} from "#/api/users";
import type { AdminUserRequest } from "#/types/user";

export const userQueryKeys = {
	all: ["users"] as const,
	list: () => [...userQueryKeys.all, "list"] as const,
	customers: () => [...userQueryKeys.all, "customers"] as const,
	drivers: () => [...userQueryKeys.all, "drivers"] as const,
};

export function useUsers() {
	return useQuery({
		queryKey: userQueryKeys.list(),
		queryFn: ({ signal }) => getUsers(signal),
	});
}

export function useCustomers() {
	return useQuery({
		queryKey: userQueryKeys.customers(),
		queryFn: ({ signal }) => getCustomers(signal),
	});
}

export function useDrivers() {
	return useQuery({
		queryKey: userQueryKeys.drivers(),
		queryFn: ({ signal }) => getDrivers(signal),
	});
}

export function useCreateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createUser,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: userQueryKeys.all }),
	});
}

export function useUpdateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, request }: { id: string; request: AdminUserRequest }) =>
			updateUser(id, request),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: userQueryKeys.all }),
	});
}

export function useDisableUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: disableUser,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: userQueryKeys.all }),
	});
}
