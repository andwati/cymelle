package com.andwati.orders.config;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;

@Validated
@ConfigurationProperties(prefix = "fare")
public record FareProperties(

        @NotNull
        @DecimalMin(value = "0.00")
        BigDecimal baseFare,

        @NotNull
        @DecimalMin(value = "0.00", inclusive = false)
        BigDecimal perKmRate,

        @NotNull
        @DecimalMin(value = "0.00")
        BigDecimal minimumFare,

        @NotNull
        @DecimalMin(value = "1.00")
        BigDecimal defaultSurgeMultiplier,

        @NotBlank
        String currency
) {
}
