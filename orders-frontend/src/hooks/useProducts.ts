import {createProduct, deactivateProduct, getProduct, getProducts, updateProduct} from "#/api/products";
import type {ProductRequest} from "#/types/product";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export const productQueryKeys = {
    all: ["products"] as const,
    detail: (id: string) => [...productQueryKeys.all, "detail", id] as const,
};

export function useProducts() {
    return useQuery({
        queryKey: productQueryKeys.all,
        queryFn: ({signal}) => getProducts(signal),
    });
}

export function useProduct(id: string) {
    return useQuery({
        queryKey: productQueryKeys.detail(id),
        queryFn: ({signal}) => getProduct(id, signal),
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProduct,
        onSuccess: () => queryClient.invalidateQueries({queryKey: productQueryKeys.all}),
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({id, request}: {id: string; request: ProductRequest}) =>
            updateProduct(id, request),
        onSuccess: () => queryClient.invalidateQueries({queryKey: productQueryKeys.all}),
    });
}

export function useDeactivateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deactivateProduct,
        onSuccess: () => queryClient.invalidateQueries({queryKey: productQueryKeys.all}),
    });
}
