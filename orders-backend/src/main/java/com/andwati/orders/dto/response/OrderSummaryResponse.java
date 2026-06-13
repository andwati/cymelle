package com.andwati.orders.dto.response;

import com.andwati.orders.model.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OrderSummaryResponse(
        UUID id,
        UUID customerId,
        String customerName,
        OrderStatus status,
        BigDecimal totalAmount,
        String currency,
        int itemCount,
        Instant createdAt,
        Instant cancelledAt
) {
}
