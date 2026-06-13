package com.andwati.orders.dto.response;

import com.andwati.orders.model.RideStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record RideResponse(
        UUID id,
        UUID orderId,
        UUID customerId,
        String customerName,
        UUID driverId,
        String driverName,
        String pickupLocation,
        String dropoffLocation,
        BigDecimal distanceKm,
        BigDecimal fareAmount,
        String currency,
        RideStatus status,
        Instant requestedAt,
        Instant acceptedAt,
        Instant completedAt,
        Instant cancelledAt
) {
}
