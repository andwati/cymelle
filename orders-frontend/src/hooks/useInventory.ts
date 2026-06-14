import { useQuery } from "@tanstack/react-query";
import { getInventory, getLowStockInventory } from "#/api/inventory";

export const inventoryQueryKeys = {
	all: ["inventory"] as const,
	list: () => [...inventoryQueryKeys.all, "list"] as const,
	lowStock: (threshold?: number) =>
		[...inventoryQueryKeys.all, "low-stock", threshold ?? "default"] as const,
};

export function useInventory() {
	return useQuery({
		queryKey: inventoryQueryKeys.list(),
		queryFn: ({ signal }) => getInventory(signal),
	});
}

export function useLowStockInventory(threshold?: number) {
	return useQuery({
		queryKey: inventoryQueryKeys.lowStock(threshold),
		queryFn: ({ signal }) => getLowStockInventory(threshold, signal),
	});
}
