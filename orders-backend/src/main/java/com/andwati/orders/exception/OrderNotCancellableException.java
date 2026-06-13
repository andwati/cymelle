package com.andwati.orders.exception;

import java.util.UUID;

public class OrderNotCancellableException extends RuntimeException {

    public OrderNotCancellableException(UUID orderId) {
        super("Order " + orderId + " cannot be cancelled because it is not in PENDING status");
    }
}
