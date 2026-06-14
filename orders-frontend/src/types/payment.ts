import type { CreateOrderRequest } from "#/types/order";

export type CheckoutQuoteRequest = CreateOrderRequest;

export type CheckoutQuote = {
	productSubtotal: number;
	rideFare: number;
	grandTotal: number;
	currency: string;
	expiresAt: string;
};

export type PaystackInitializeRequest = CreateOrderRequest;

export type PaystackInitializeResponse = {
	authorizationUrl: string;
	accessCode: string;
	reference: string;
	orderId: string;
	rideId: string | null;
	amount: number;
	currency: string;
	status: "PENDING" | "PAID" | "FAILED" | "ABANDONED" | "REFUNDED";
};

export type PaystackVerifyResponse = {
	reference: string;
	status: "PENDING" | "PAID" | "FAILED" | "ABANDONED" | "REFUNDED";
	orderId: string;
	rideId: string | null;
	amount: number;
	currency: string;
	message: string;
};
