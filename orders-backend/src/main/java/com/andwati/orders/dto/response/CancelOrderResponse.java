package com.andwati.orders.dto.response;


import com.andwati.orders.model.OrderStatus;

import java.time.Instant;
import java.util.UUID;

public record CancelOrderResponse(
        UUID id,
        OrderStatus status,
        Instant cancelledAt,
        boolean stockRolledBack
) {
}