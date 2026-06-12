package com.andwati.orders.mappers;

import com.andwati.orders.dto.response.InventoryItemResponse;
import com.andwati.orders.model.InventoryItem;
import org.springframework.stereotype.Component;

@Component
public class InventoryMapper {

    public InventoryItemResponse toResponse(InventoryItem inventoryItem) {
        return new InventoryItemResponse(
                inventoryItem.getProduct().getId(),
                inventoryItem.getProduct().getName(),
                inventoryItem.getProduct().getSku(),
                inventoryItem.getAvailableQuantity(),
                inventoryItem.getReservedQuantity(),
                inventoryItem.getReorderLevel(),
                inventoryItem.getStatus(),
                inventoryItem.getUpdatedAt()
        );
    }
}