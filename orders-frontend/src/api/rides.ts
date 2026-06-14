import { apiRequest } from "#/api/client";
import type { CreateRideRequest, Ride, RideStatus } from "#/types/ride";

export function getRides(signal?: AbortSignal) {
	return apiRequest<Ride[]>("/rides", { signal });
}

export function requestRide(request: CreateRideRequest) {
	return apiRequest<Ride>("/rides", {
		method: "POST",
		body: request,
	});
}

export function acceptRide(id: string) {
	return apiRequest<Ride>(`/rides/${id}/accept`, { method: "POST" });
}

export function completeRide(id: string) {
	return apiRequest<Ride>(`/rides/${id}/complete`, { method: "POST" });
}

export function cancelRide(id: string) {
	return apiRequest<Ride>(`/rides/${id}`, { method: "DELETE" });
}

export function updateRideStatus(id: string, status: RideStatus) {
	return apiRequest<Ride>(`/rides/${id}/status`, {
		method: "PATCH",
		body: { status },
	});
}
