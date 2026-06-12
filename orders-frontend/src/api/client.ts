import type {ApiErrorResponse} from "#/types/api";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

export class ApiError extends Error {
    status: number;
    code: string;
    details: unknown;

    constructor(status: number, error: ApiErrorResponse) {
        super(error.message || "Request failed");
        this.name = "ApiError";
        this.status = status;
        this.code = error.error;
        this.details = error.details;
    }
}

type RequestOptions = {
    method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
    body?: unknown;
    signal?: AbortSignal;
};

export async function apiRequest<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method ?? "GET",
        headers: {
            "Content-Type": "application/json",
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
    });

    if (!response.ok) {
        let errorBody: ApiErrorResponse;

        try {
            errorBody = await response.json();
        } catch {
            errorBody = {
                error: "REQUEST_FAILED",
                message: `Request failed with status ${response.status}`,
                details: null,
                timestamp: new Date().toISOString(),
                path,
            };
        }

        throw new ApiError(response.status, errorBody);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}