package com.andwati.orders.dto.request;

import com.andwati.orders.model.RideStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateRideStatusRequest(
        @NotNull(message = "status is required")
        RideStatus status
) {
}
