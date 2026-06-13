package com.andwati.orders.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank(message = "name is required")
        @Size(max = 120, message = "name must be 120 characters or fewer")
        String name,

        @NotBlank(message = "sku is required")
        @Size(max = 80, message = "sku must be 80 characters or fewer")
        String sku,

        @NotNull(message = "price is required")
        @DecimalMin(value = "0.01", message = "price must be greater than 0")
        BigDecimal price,

        @NotBlank(message = "currency is required")
        @Size(min = 3, max = 3, message = "currency must be a 3-letter code")
        String currency,

        boolean active,

        @Min(value = 0, message = "availableQuantity must be greater than or equal to 0")
        int availableQuantity,

        @Min(value = 0, message = "reorderLevel must be greater than or equal to 0")
        int reorderLevel
) {
}
