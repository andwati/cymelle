import {apiRequest} from "#/api/client";
import type {FareCalculationResponse} from "#/types/fare";

export function calculateFare(
    distanceKm: number,
    surgeMultiplier?: number,
    signal?: AbortSignal,
) {
    const params = new URLSearchParams();
    params.set("distanceKm", String(distanceKm));

    if (surgeMultiplier !== undefined) {
        params.set("surgeMultiplier", String(surgeMultiplier));
    }

    return apiRequest<FareCalculationResponse>(
        `/fare/calculate?${params.toString()}`,
        {signal},
    );
}