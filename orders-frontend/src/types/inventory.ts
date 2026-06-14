export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type InventoryItem = {
	productId: string;
	productName: string;
	sku: string;
	availableQuantity: number;
	reservedQuantity: number;
	reorderLevel: number;
	status: InventoryStatus;
	updatedAt: string;
};

export type InventoryResponse = {
	items: InventoryItem[];
};

export type LowStockInventoryResponse = {
	threshold: number;
	items: InventoryItem[];
};
