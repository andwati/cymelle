import {calculateFare} from "#/api/fare";
import {useMutation} from "@tanstack/react-query";

type FareCalculationInput = {
    distanceKm: number;
    surgeMultiplier?: number;
};

export function useFareCalculation() {
    return useMutation({
        mutationFn: ({distanceKm, surgeMultiplier}: FareCalculationInput) =>
            calculateFare(distanceKm, surgeMultiplier),
    });
}