package com.andwati.orders.dto.response;

public record CsrfResponse(
        String headerName,
        String parameterName,
        String token
) {
}
