package com.andwati.orders.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateRideRequest(
        @NotNull(message = "orderId is required")
        UUID orderId,

        @NotBlank(message = "pickupLocation is required")
        @Size(max = 160, message = "pickupLocation must be 160 characters or fewer")
        String pickupLocation,

        @NotBlank(message = "dropoffLocation is required")
        @Size(max = 160, message = "dropoffLocation must be 160 characters or fewer")
        String dropoffLocation,

        @NotNull(message = "distanceKm is required")
        @DecimalMin(value = "0.1", message = "distanceKm must be greater than 0")
        BigDecimal distanceKm
) {
}
