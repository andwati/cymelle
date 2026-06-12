package com.andwati.orders.controller;

import com.andwati.orders.dto.response.InventoryResponse;
import com.andwati.orders.dto.response.LowStockInventoryResponse;
import com.andwati.orders.services.InventoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public InventoryResponse getInventory() {
        return inventoryService.getInventory();
    }

    @GetMapping("/low-stock")
    public LowStockInventoryResponse getLowStockItems(
            @RequestParam(required = false) Integer threshold
    ) {
        return inventoryService.getLowStockItems(threshold);
    }
}