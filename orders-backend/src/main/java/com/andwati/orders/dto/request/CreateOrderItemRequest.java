package com.andwati.orders.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateOrderItemRequest(
        @NotNull(message = "productId is required")
        UUID productId,

        @Min(value = 1, message = "quantity must be at least 1")
        int quantity
) {
}