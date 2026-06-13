package com.andwati.orders.dto.response;

import com.andwati.orders.model.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        UUID customerId,
        String customerName,
        OrderStatus status,
        List<OrderItemResponse> items,
        BigDecimal totalAmount,
        String currency,
        Instant createdAt,
        Instant cancelledAt
) {
}
