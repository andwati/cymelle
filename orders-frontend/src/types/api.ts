export type ApiErrorResponse = {
	error: string;
	message: string;
	details: unknown;
	timestamp: string;
	path: string;
};

export type PageResponse<T> = {
	items: T[];
	page: number;
	size: number;
	totalItems: number;
	totalPages: number;
};
