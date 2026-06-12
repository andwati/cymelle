package com.andwati.orders.services;


import com.andwati.orders.config.InventoryProperties;
import com.andwati.orders.dto.response.InventoryResponse;
import com.andwati.orders.dto.response.LowStockInventoryResponse;
import com.andwati.orders.mappers.InventoryMapper;
import com.andwati.orders.repository.InventoryItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryMapper inventoryMapper;
    private final InventoryProperties inventoryProperties;

    public InventoryService(
            InventoryItemRepository inventoryItemRepository,
            InventoryMapper inventoryMapper,
            InventoryProperties inventoryProperties
    ) {
        this.inventoryItemRepository = inventoryItemRepository;
        this.inventoryMapper = inventoryMapper;
        this.inventoryProperties = inventoryProperties;
    }

    @Transactional(readOnly = true)
    public InventoryResponse getInventory() {
        var items = inventoryItemRepository.findAllWithProducts()
                .stream()
                .map(inventoryMapper::toResponse)
                .toList();

        return new InventoryResponse(items);
    }

    @Transactional(readOnly = true)
    public LowStockInventoryResponse getLowStockItems(Integer threshold) {
        int effectiveThreshold = threshold == null
                ? inventoryProperties.lowStockThreshold()
                : threshold;

        if (effectiveThreshold < 0) {
            throw new IllegalArgumentException("threshold must be greater than or equal to 0");
        }

        var items = inventoryItemRepository.findLowStockItems(effectiveThreshold)
                .stream()
                .map(inventoryMapper::toResponse)
                .toList();

        return new LowStockInventoryResponse(effectiveThreshold, items);
    }
}