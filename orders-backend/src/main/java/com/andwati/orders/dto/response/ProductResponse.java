package com.andwati.orders.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String name,
        String sku,
        BigDecimal price,
        String currency,
        boolean active,
        int availableQuantity,
        int reorderLevel,
        Instant updatedAt
) {
}
