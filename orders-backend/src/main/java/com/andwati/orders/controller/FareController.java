package com.andwati.orders.controller;

import com.andwati.orders.dto.response.FareCalculationResponse;
import com.andwati.orders.services.FareCalculationService;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@Validated
@RestController
public class FareController {

    private final FareCalculationService fareCalculationService;

    public FareController(FareCalculationService fareCalculationService) {
        this.fareCalculationService = fareCalculationService;
    }

    @GetMapping("/api/fare/calculate")
    public FareCalculationResponse calculateFare(
            @RequestParam
            @NotNull(message = "distanceKm is required")
            @DecimalMin(value = "0.0", inclusive = false, message = "distanceKm must be greater than 0")
            BigDecimal distanceKm,

            @RequestParam(required = false)
            @DecimalMin(value = "1.0", message = "surgeMultiplier must be greater than or equal to 1.0")
            BigDecimal surgeMultiplier
    ) {
        return fareCalculationService.calculateFare(distanceKm, surgeMultiplier);
    }
}