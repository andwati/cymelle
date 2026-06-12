import {apiRequest} from "#/api/client";
import type {InventoryResponse, LowStockInventoryResponse,} from "#/types/inventory";

export function getInventory(signal?: AbortSignal) {
    return apiRequest<InventoryResponse>("/inventory", {signal});
}

export function getLowStockInventory(
    threshold?: number,
    signal?: AbortSignal,
) {
    const params = new URLSearchParams();

    if (threshold !== undefined) {
        params.set("threshold", String(threshold));
    }

    const query = params.toString();

    return apiRequest<LowStockInventoryResponse>(
        `/inventory/low-stock${query ? `?${query}` : ""}`,
        {signal},
    );
}