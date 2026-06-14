export type RideStatus = "REQUESTED" | "ACCEPTED" | "COMPLETED" | "CANCELLED";

export type Ride = {
	id: string;
	orderId: string | null;
	customerId: string;
	customerName: string;
	driverId: string | null;
	driverName: string | null;
	pickupLocation: string;
	dropoffLocation: string;
	distanceKm: number;
	fareAmount: number | null;
	currency: string;
	status: RideStatus;
	requestedAt: string;
	acceptedAt: string | null;
	completedAt: string | null;
	cancelledAt: string | null;
};

export type CreateRideRequest = {
	orderId: string;
	pickupLocation: string;
	dropoffLocation: string;
	distanceKm: number;
};
