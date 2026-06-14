import { apiRequest } from "#/api/client";
import type {
	CheckoutQuote,
	CheckoutQuoteRequest,
	PaystackInitializeRequest,
	PaystackInitializeResponse,
	PaystackVerifyResponse,
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

export function initializePaystackPayment(request: PaystackInitializeRequest) {
	return apiRequest<PaystackInitializeResponse>(
		"/payments/paystack/initialize",
		{
			method: "POST",
			body: request,
		},
	);
}

export function verifyPaystackPayment(reference: string) {
	return apiRequest<PaystackVerifyResponse>(
		`/payments/paystack/verify/${encodeURIComponent(reference)}`,
		{
			method: "POST",
		},
	);
}
