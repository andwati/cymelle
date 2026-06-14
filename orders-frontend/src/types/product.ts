export type Product = {
	id: string;
	name: string;
	sku: string;
	price: number;
	currency: string;
	active: boolean;
	availableQuantity: number;
	reorderLevel: number;
	updatedAt: string;
};

export type ProductRequest = {
	name: string;
	sku: string;
	price: number;
	currency: string;
	active: boolean;
	availableQuantity: number;
	reorderLevel: number;
};
