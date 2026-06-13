package com.andwati.orders.dto.response;

import com.andwati.orders.model.Role;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String displayName,
        Role role,
        boolean enabled,
        Instant createdAt
) {
}
