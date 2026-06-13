package com.andwati.orders.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "username is required")
        @Size(min = 3, max = 80, message = "username must be between 3 and 80 characters")
        String username,

        @NotBlank(message = "displayName is required")
        @Size(min = 2, max = 120, message = "displayName must be between 2 and 120 characters")
        String displayName,

        @NotBlank(message = "password is required")
        @Size(min = 6, max = 120, message = "password must be between 6 and 120 characters")
        String password
) {
}
