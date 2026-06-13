package com.andwati.orders.dto.request;

import com.andwati.orders.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminUserRequest(
        @NotBlank(message = "username is required")
        @Size(max = 80, message = "username must be 80 characters or fewer")
        String username,

        @NotBlank(message = "displayName is required")
        @Size(max = 120, message = "displayName must be 120 characters or fewer")
        String displayName,

        @Size(min = 6, max = 120, message = "password must be between 6 and 120 characters")
        String password,

        @NotNull(message = "role is required")
        Role role,

        boolean enabled
) {
}
