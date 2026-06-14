package com.andwati.orders.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CheckoutQuoteRequest(
        @Valid
        @Size(min = 1, message = "items must contain at least one item")
        List<CreateOrderItemRequest> items,

        @Valid
        CreateOrderRideRequest deliveryRide
) {
}
