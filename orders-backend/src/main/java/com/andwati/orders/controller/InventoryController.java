package com.andwati.orders.controller;

import com.andwati.orders.dto.response.InventoryResponse;
import com.andwati.orders.dto.response.LowStockInventoryResponse;
import com.andwati.orders.services.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Inventory", description = "View inventory and low-stock items")
@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @Operation(
            summary = "List inventory",
            description = "Returns the current inventory for all products, including quantities and stock status."
    )
    @GetMapping
    public InventoryResponse getInventory() {
        return inventoryService.getInventory();
    }

    @Operation(
            summary = "List low-stock inventory",
            description = """
                    Returns inventory items whose available quantity is at or below the requested threshold.
                    When the threshold is omitted, the API uses the configured low-stock threshold.
                    """
    )
    @GetMapping("/low-stock")
    public LowStockInventoryResponse getLowStockItems(
            @Parameter(
                    description = "Optional low-stock threshold. Must be greater than or equal to 0.",
                    example = "10"
            )
            @RequestParam(required = false) Integer threshold
    ) {
        return inventoryService.getLowStockItems(threshold);
    }
}
