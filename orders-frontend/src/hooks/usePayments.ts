import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCheckoutQuote, simulateCheckout } from "#/api/payments";
import { inventoryQueryKeys } from "#/hooks/useInventory";
import { orderQueryKeys } from "#/hooks/useOrders";
import { productQueryKeys } from "#/hooks/useProducts";
import type {
	CheckoutQuoteRequest,
	SimulatedCheckoutRequest,
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

export function useSimulateCheckout() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (request: SimulatedCheckoutRequest) =>
			simulateCheckout(request),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: orderQueryKeys.all }),
				queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all }),
				queryClient.invalidateQueries({ queryKey: productQueryKeys.all }),
			]);
		},
	});
}
