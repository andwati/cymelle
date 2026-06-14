export type Role = "ADMIN" | "CUSTOMER" | "DRIVER";

export type AuthUser = {
	id: string;
	username: string;
	displayName: string;
	role: Role;
};

export type LoginRequest = {
	username: string;
	password: string;
};

export type RegisterRequest = LoginRequest & {
	displayName: string;
};
