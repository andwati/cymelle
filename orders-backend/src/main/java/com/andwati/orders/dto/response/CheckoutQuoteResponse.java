package com.andwati.orders.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record CheckoutQuoteResponse(
        BigDecimal productSubtotal,
        BigDecimal rideFare,
        BigDecimal grandTotal,
        String currency,
        Instant expiresAt
) {
}
