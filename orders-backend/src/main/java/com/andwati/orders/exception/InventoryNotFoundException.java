package com.andwati.orders.exception;

import java.util.UUID;

public class InventoryNotFoundException extends RuntimeException {

    public InventoryNotFoundException(UUID productId) {
        super("Inventory record for product " + productId + " does not exist");
    }
}