export type FareCalculationResponse = {
    distanceKm: number;
    baseFare: number;
    perKmRate: number;
    surgeMultiplier: number;
    minimumFare: number;
    calculatedFare: number;
    currency: string;
    formula: string;
};