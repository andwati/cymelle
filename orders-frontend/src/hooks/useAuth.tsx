import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, login, logout, register } from "#/api/auth";
import type { AuthUser, LoginRequest, RegisterRequest } from "#/types/auth";

type AuthContextValue = {
	user: AuthUser | null;
	isLoading: boolean;
	login: (request: LoginRequest) => Promise<AuthUser>;
	register: (request: RegisterRequest) => Promise<AuthUser>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const storedUserKey = "cymelle.auth.user";

export const authQueryKeys = {
	me: ["auth", "me"] as const,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient();
	const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
	const [isLoading, setIsLoading] = useState(() => readStoredUser() !== null);
	const userId = user?.id;

	useEffect(() => {
		let cancelled = false;

		if (!userId) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		getCurrentUser()
			.then((currentUser) => {
				if (cancelled) {
					return;
				}

				persistUser(currentUser);
				setUser(currentUser);
				queryClient.setQueryData(authQueryKeys.me, currentUser);
			})
			.catch(() => {
				if (cancelled) {
					return;
				}

				persistUser(null);
				setUser(null);
				queryClient.clear();
			})
			.finally(() => {
				if (!cancelled) {
					setIsLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [queryClient, userId]);

	const loginMutation = useMutation({
		mutationFn: login,
		onSuccess: (user) => {
			queryClient.clear();
			persistUser(user);
			setUser(user);
			queryClient.setQueryData(authQueryKeys.me, user);
		},
	});

	const registerMutation = useMutation({
		mutationFn: register,
		onSuccess: (user) => {
			queryClient.clear();
			persistUser(user);
			setUser(user);
			queryClient.setQueryData(authQueryKeys.me, user);
		},
	});

	const logoutMutation = useMutation({
		mutationFn: logout,
		onSettled: () => {
			persistUser(null);
			setUser(null);
			queryClient.clear();
		},
	});

	async function logoutUser() {
		persistUser(null);
		setUser(null);
		queryClient.clear();
		await logoutMutation.mutateAsync().catch(() => undefined);
	}

	const value: AuthContextValue = {
		user,
		isLoading,
		login: loginMutation.mutateAsync,
		register: registerMutation.mutateAsync,
		logout: logoutUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}

	return context;
}

function readStoredUser() {
	if (typeof window === "undefined") {
		return null;
	}

	const raw = window.localStorage.getItem(storedUserKey);
	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as AuthUser;
	} catch {
		window.localStorage.removeItem(storedUserKey);
		return null;
	}
}

function persistUser(user: AuthUser | null) {
	if (typeof window === "undefined") {
		return;
	}

	if (!user) {
		window.localStorage.removeItem(storedUserKey);
		return;
	}

	window.localStorage.setItem(storedUserKey, JSON.stringify(user));
}
