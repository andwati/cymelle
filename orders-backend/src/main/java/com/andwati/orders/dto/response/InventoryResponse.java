package com.andwati.orders.dto.response;

import java.util.List;

public record InventoryResponse(
        List<InventoryItemResponse> items
) {
}