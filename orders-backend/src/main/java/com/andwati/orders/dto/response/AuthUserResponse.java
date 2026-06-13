package com.andwati.orders.dto.response;

import com.andwati.orders.model.Role;

import java.util.UUID;

public record AuthUserResponse(
        UUID id,
        String username,
        String displayName,
        Role role
) {
}
