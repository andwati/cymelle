package com.andwati.orders.dto.response;

import com.andwati.orders.model.PaymentStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record PaystackVerifyResponse(
        String reference,
        PaymentStatus status,
        UUID orderId,
        UUID rideId,
        BigDecimal amount,
        String currency,
        String message
) {
}
