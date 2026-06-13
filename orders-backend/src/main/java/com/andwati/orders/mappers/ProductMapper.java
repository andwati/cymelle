package com.andwati.orders.mappers;

import com.andwati.orders.dto.response.ProductResponse;
import com.andwati.orders.model.InventoryItem;
import com.andwati.orders.model.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product product, InventoryItem inventoryItem) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getSku(),
                product.getPrice(),
                product.getCurrency(),
                product.isActive(),
                inventoryItem == null ? 0 : inventoryItem.getAvailableQuantity(),
                inventoryItem == null ? 0 : inventoryItem.getReorderLevel(),
                inventoryItem == null ? product.getUpdatedAt() : inventoryItem.getUpdatedAt()
        );
    }
}
