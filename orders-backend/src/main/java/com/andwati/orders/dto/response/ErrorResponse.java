package com.andwati.orders.dto.response;

import java.time.Instant;

public record ErrorResponse(
        String error,
        String message,
        Object details,
        Instant timestamp,
        String path
) {
}