import { apiRequest } from "#/api/client";
import type { PageResponse } from "#/types/api";
import type {
	CancelOrderResponse,
	CreateOrderRequest,
	Order,
	OrderFilters,
	OrderStatus,
	OrderSummary,
} from "#/types/order";

export function getOrders(
	filters: OrderFilters,
	page = 0,
	size = 20,
	signal?: AbortSignal,
) {
	const params = new URLSearchParams();

	if (filters.status) {
		params.set("status", filters.status);
	}

	if (filters.from) {
		params.set("from", filters.from);
	}

	if (filters.to) {
		params.set("to", filters.to);
	}

	params.set("page", String(page));
	params.set("size", String(size));

	return apiRequest<PageResponse<OrderSummary>>(
		`/orders?${params.toString()}`,
		{
			signal,
		},
	);
}

export function getOrder(id: string, signal?: AbortSignal) {
	return apiRequest<Order>(`/orders/${id}`, { signal });
}

export function createOrder(request: CreateOrderRequest) {
	return apiRequest<Order>("/orders", {
		method: "POST",
		body: request,
	});
}

export function cancelOrder(id: string) {
	return apiRequest<CancelOrderResponse>(`/orders/${id}`, {
		method: "DELETE",
	});
}

export function updateOrderStatus(id: string, status: OrderStatus) {
	return apiRequest<Order>(`/orders/${id}/status`, {
		method: "PATCH",
		body: { status },
	});
}
