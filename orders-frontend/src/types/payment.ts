import type { CreateOrderRequest } from "#/types/order";

export type CheckoutQuoteRequest = CreateOrderRequest;

export type CheckoutQuote = {
	productSubtotal: number;
	rideFare: number;
	grandTotal: number;
	currency: string;
	expiresAt: string;
};

export type SimulatedCheckoutRequest = CreateOrderRequest;

export type SimulatedCheckoutResponse = {
	reference: string;
	orderId: string;
	rideId: string | null;
	amount: number;
	currency: string;
	status: "PENDING" | "PAID" | "FAILED" | "ABANDONED" | "REFUNDED";
	message: string;
};
