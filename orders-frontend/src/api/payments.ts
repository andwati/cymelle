import { apiRequest } from "#/api/client";
import type {
	CheckoutQuote,
	CheckoutQuoteRequest,
	SimulatedCheckoutRequest,
	SimulatedCheckoutResponse,
} from "#/types/payment";

export function getCheckoutQuote(
	request: CheckoutQuoteRequest,
	signal?: AbortSignal,
) {
	return apiRequest<CheckoutQuote>("/checkout/quote", {
		method: "POST",
		body: request,
		signal,
	});
}

export function simulateCheckout(request: SimulatedCheckoutRequest) {
	return apiRequest<SimulatedCheckoutResponse>("/checkout/simulate", {
		method: "POST",
		body: request,
	});
}
