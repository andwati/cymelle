export type OrderStatus = "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type OrderItem = {
	productId: string;
	productName: string;
	quantity: number;
	unitPrice: number;
	lineTotal: number;
};

export type Order = {
	id: string;
	customerId: string | null;
	customerName: string;
	status: OrderStatus;
	items: OrderItem[];
	totalAmount: number;
	currency: string;
	createdAt: string;
	cancelledAt: string | null;
};

export type OrderSummary = {
	id: string;
	customerId: string | null;
	customerName: string;
	status: OrderStatus;
	totalAmount: number;
	currency: string;
	itemCount: number;
	createdAt: string;
	cancelledAt: string | null;
};

export type OrderFilters = {
	status?: OrderStatus | "";
	from?: string;
	to?: string;
};

export type CancelOrderResponse = {
	id: string;
	status: OrderStatus;
	cancelledAt: string;
	stockRolledBack: boolean;
};

export type CreateOrderRequest = {
	items: {
		productId: string;
		quantity: number;
	}[];
	deliveryRide?: {
		pickupLocation: string;
		dropoffLocation: string;
		distanceKm: number;
	} | null;
};
