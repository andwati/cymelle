import type {ApiErrorResponse} from "#/types/api";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

let csrfToken: string | null = null;
let csrfHeaderName = "X-XSRF-TOKEN";

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

type CsrfResponse = {
    headerName: string;
    parameterName: string;
    token: string;
};

async function loadCsrfToken() {
    const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Could not initialize request security");
    }

    const data = (await response.json()) as CsrfResponse;
    csrfToken = data.token;
    csrfHeaderName = data.headerName;
}

function isMutating(method: string) {
    return method !== "GET";
}

export async function apiRequest<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const method = options.method ?? "GET";

    if (isMutating(method) && !csrfToken) {
        await loadCsrfToken();
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(isMutating(method) && csrfToken ? {[csrfHeaderName]: csrfToken} : {}),
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

    const text = await response.text();
    if (!text) {
        return undefined as T;
    }

    return JSON.parse(text) as T;
}

export function clearRequestSecurity() {
    csrfToken = null;
}

export async function initializeRequestSecurity() {
    await loadCsrfToken();
}
