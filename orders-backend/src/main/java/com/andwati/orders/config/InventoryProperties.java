package com.andwati.orders.config;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "inventory")
public record InventoryProperties(

        @Min(0)
        int lowStockThreshold
) {

}
