import { useMutation } from "@tanstack/react-query";
import { calculateFare } from "#/api/fare";

type FareCalculationInput = {
	distanceKm: number;
	surgeMultiplier?: number;
};

export function useFareCalculation() {
	return useMutation({
		mutationFn: ({ distanceKm, surgeMultiplier }: FareCalculationInput) =>
			calculateFare(distanceKm, surgeMultiplier),
	});
}
