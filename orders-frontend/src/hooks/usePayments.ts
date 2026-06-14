import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getCheckoutQuote,
	initializePaystackPayment,
	verifyPaystackPayment,
} from "#/api/payments";
import { inventoryQueryKeys } from "#/hooks/useInventory";
import { orderQueryKeys } from "#/hooks/useOrders";
import { productQueryKeys } from "#/hooks/useProducts";
import type {
	CheckoutQuoteRequest,
	PaystackInitializeRequest,
} from "#/types/payment";

export const paymentQueryKeys = {
	all: ["payments"] as const,
	quote: (request: CheckoutQuoteRequest) =>
		[...paymentQueryKeys.all, "quote", request] as const,
};

export function useCheckoutQuote(
	request: CheckoutQuoteRequest,
	enabled: boolean,
) {
	return useQuery({
		queryKey: paymentQueryKeys.quote(request),
		queryFn: ({ signal }) => getCheckoutQuote(request, signal),
		enabled,
	});
}

export function useInitializePaystackPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (request: PaystackInitializeRequest) =>
			initializePaystackPayment(request),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: orderQueryKeys.all }),
				queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all }),
				queryClient.invalidateQueries({ queryKey: productQueryKeys.all }),
			]);
		},
	});
}

export function useVerifyPaystackPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: verifyPaystackPayment,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: orderQueryKeys.all }),
				queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all }),
				queryClient.invalidateQueries({ queryKey: productQueryKeys.all }),
			]);
		},
	});
}
