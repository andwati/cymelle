package com.andwati.orders.services;

import com.andwati.orders.config.FareProperties;
import com.andwati.orders.dto.response.FareCalculationResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class FareCalculationService {

    private static final String FORMULA =
            "max(minimumFare, (baseFare + distanceKm * perKmRate) * surgeMultiplier)";

    private final FareProperties fareProperties;

    public FareCalculationService(FareProperties fareProperties) {
        this.fareProperties = fareProperties;
    }

    public FareCalculationResponse calculateFare(BigDecimal distanceKm, BigDecimal surgeMultiplier) {
        if (distanceKm == null || distanceKm.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("distanceKm must be greater than 0");
        }

        BigDecimal effectiveSurgeMultiplier = surgeMultiplier == null
                ? fareProperties.defaultSurgeMultiplier()
                : surgeMultiplier;

        if (effectiveSurgeMultiplier.compareTo(BigDecimal.ONE) < 0) {
            throw new IllegalArgumentException("surgeMultiplier must be greater than or equal to 1.0");
        }

        BigDecimal rawFare = fareProperties.baseFare()
                .add(distanceKm.multiply(fareProperties.perKmRate()));

        BigDecimal surgedFare = rawFare.multiply(effectiveSurgeMultiplier);

        BigDecimal finalFare = surgedFare.max(fareProperties.minimumFare())
                .setScale(2, RoundingMode.HALF_UP);

        return new FareCalculationResponse(
                distanceKm,
                fareProperties.baseFare(),
                fareProperties.perKmRate(),
                effectiveSurgeMultiplier,
                fareProperties.minimumFare(),
                finalFare,
                fareProperties.currency(),
                FORMULA
        );
    }
}