package com.andwati.orders.dto.response;


import com.andwati.orders.model.InventoryStatus;

import java.time.Instant;
import java.util.UUID;

public record InventoryItemResponse(
        UUID productId,
        String productName,
        String sku,
        int availableQuantity,
        int reservedQuantity,
        int reorderLevel,
        InventoryStatus status,
        Instant updatedAt
) {
}