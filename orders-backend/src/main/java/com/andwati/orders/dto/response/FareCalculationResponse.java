package com.andwati.orders.dto.response;


import java.math.BigDecimal;

public record FareCalculationResponse(
        BigDecimal distanceKm,
        BigDecimal baseFare,
        BigDecimal perKmRate,
        BigDecimal surgeMultiplier,
        BigDecimal minimumFare,
        BigDecimal calculatedFare,
        String currency,
        String formula
) {
}