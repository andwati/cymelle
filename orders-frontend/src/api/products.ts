import {apiRequest} from "#/api/client";
import type {Product, ProductRequest} from "#/types/product";

export function getProducts(signal?: AbortSignal) {
    return apiRequest<Product[]>("/products", {signal});
}

export function getProduct(id: string, signal?: AbortSignal) {
    return apiRequest<Product>(`/products/${id}`, {signal});
}

export function createProduct(request: ProductRequest) {
    return apiRequest<Product>("/products", {
        method: "POST",
        body: request,
    });
}

export function updateProduct(id: string, request: ProductRequest) {
    return apiRequest<Product>(`/products/${id}`, {
        method: "PUT",
        body: request,
    });
}

export function deactivateProduct(id: string) {
    return apiRequest<Product>(`/products/${id}`, {method: "DELETE"});
}
