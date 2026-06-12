package com.andwati.orders.exception;

import java.util.Map;
import java.util.UUID;

public class InsufficientStockException extends RuntimeException {

    private final Map<String, Object> details;

    public InsufficientStockException(
            UUID productId,
            String productName,
            int requestedQuantity,
            int availableQuantity
    ) {
        super("Insufficient stock for " + productName);
        this.details = Map.of(
                "productId", productId,
                "productName", productName,
                "requestedQuantity", requestedQuantity,
                "availableQuantity", availableQuantity
        );
    }

    public Map<String, Object> getDetails() {
        return details;
    }
}