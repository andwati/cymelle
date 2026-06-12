package com.andwati.orders.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateOrderRequest(
        @NotBlank(message = "customerName is required")
        @Size(min = 2, max = 120, message = "customerName must be between 2 and 120 characters")
        String customerName,

        @Valid
        @Size(min = 1, message = "items must contain at least one item")
        List<CreateOrderItemRequest> items
) {
}
