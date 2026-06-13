import {cancelOrder, createOrder, getOrders, updateOrderStatus} from "#/api/orders";
import {inventoryQueryKeys} from "#/hooks/useInventory";
import {productQueryKeys} from "#/hooks/useProducts";
import type {OrderFilters} from "#/types/order";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export const orderQueryKeys = {
    all: ["orders"] as const,
    list: (filters: OrderFilters, page = 0, size = 20) =>
        [...orderQueryKeys.all, "list", filters, page, size] as const,
};

export function useOrders(filters: OrderFilters, page = 0, size = 20) {
    return useQuery({
        queryKey: orderQueryKeys.list(filters, page, size),
        queryFn: ({signal}) => getOrders(filters, page, size, signal),
    });
}

export function useCancelOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: cancelOrder,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: orderQueryKeys.all,
                }),
                queryClient.invalidateQueries({
                    queryKey: inventoryQueryKeys.all,
                }),
                queryClient.invalidateQueries({
                    queryKey: productQueryKeys.all,
                }),
            ]);
        },
    });
}

export function useCreateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createOrder,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({queryKey: orderQueryKeys.all}),
                queryClient.invalidateQueries({queryKey: inventoryQueryKeys.all}),
                queryClient.invalidateQueries({queryKey: productQueryKeys.all}),
            ]);
        },
    });
}

export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({id, status}: {id: string; status: import("#/types/order").OrderStatus}) =>
            updateOrderStatus(id, status),
        onSuccess: () => queryClient.invalidateQueries({queryKey: orderQueryKeys.all}),
    });
}
