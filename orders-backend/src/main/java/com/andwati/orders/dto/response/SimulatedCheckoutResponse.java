package com.andwati.orders.dto.response;

import com.andwati.orders.model.PaymentStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record SimulatedCheckoutResponse(
        String reference,
        UUID orderId,
        UUID rideId,
        BigDecimal amount,
        String currency,
        PaymentStatus status,
        String message
) {
}
