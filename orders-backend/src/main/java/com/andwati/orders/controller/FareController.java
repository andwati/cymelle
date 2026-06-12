package com.andwati.orders.controller;

import com.andwati.orders.dto.response.FareCalculationResponse;
import com.andwati.orders.services.FareCalculationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@Tag(name = "Fare", description = "Calculate trip fares")
@Validated
@RestController
public class FareController {

    private final FareCalculationService fareCalculationService;

    public FareController(FareCalculationService fareCalculationService) {
        this.fareCalculationService = fareCalculationService;
    }

    @Operation(
            summary = "Calculate a trip fare",
            description = """
                    Calculates the final fare for a trip distance using the configured base fare, per-kilometer rate,
                    optional surge multiplier, and minimum fare. If no surge multiplier is provided, the default
                    configured multiplier is used.
                    """
    )
    @GetMapping("/api/fare/calculate")
    public FareCalculationResponse calculateFare(
            @Parameter(description = "Trip distance in kilometers. Must be greater than 0.", example = "12.5")
            @RequestParam
            @NotNull(message = "distanceKm is required")
            @DecimalMin(value = "0.0", inclusive = false, message = "distanceKm must be greater than 0")
            BigDecimal distanceKm,

            @Parameter(
                    description = "Optional surge multiplier. Must be greater than or equal to 1.0.",
                    example = "1.25"
            )
            @RequestParam(required = false)
            @DecimalMin(value = "1.0", message = "surgeMultiplier must be greater than or equal to 1.0")
            BigDecimal surgeMultiplier
    ) {
        return fareCalculationService.calculateFare(distanceKm, surgeMultiplier);
    }
}
