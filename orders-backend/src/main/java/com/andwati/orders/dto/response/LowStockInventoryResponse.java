package com.andwati.orders.dto.response;

import java.util.List;

public record LowStockInventoryResponse(
        int threshold,
        List<InventoryItemResponse> items
) {
}
