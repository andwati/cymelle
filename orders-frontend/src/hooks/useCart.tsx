import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "#/types/product";

export type CartItem = {
	product: Product;
	quantity: number;
};

type CartContextValue = {
	items: CartItem[];
	itemCount: number;
	totalAmount: number;
	currency: string;
	addItem: (product: Product, quantity: number) => void;
	updateQuantity: (productId: string, quantity: number) => void;
	removeItem: (productId: string) => void;
	clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_KEY = "cymelle_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
	const [items, setItems] = useState<CartItem[]>(() => {
		if (typeof window === "undefined") {
			return [];
		}

		try {
			return JSON.parse(
				window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]",
			) as CartItem[];
		} catch {
			return [];
		}
	});

	const itemCount = useMemo(
		() => items.reduce((total, item) => total + item.quantity, 0),
		[items],
	);

	const totalAmount = useMemo(
		() =>
			items.reduce(
				(total, item) => total + item.product.price * item.quantity,
				0,
			),
		[items],
	);

	const currency = items[0]?.product.currency ?? "KES";

	useEffect(() => {
		window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
	}, [items]);

	function addItem(product: Product, quantity: number) {
		const safeQuantity = Math.min(
			Math.max(quantity, 1),
			product.availableQuantity,
		);

		setItems((currentItems) => {
			const existing = currentItems.find(
				(item) => item.product.id === product.id,
			);

			if (existing) {
				return currentItems.map((item) =>
					item.product.id === product.id
						? {
								...item,
								product,
								quantity: Math.min(
									item.quantity + safeQuantity,
									product.availableQuantity,
								),
							}
						: item,
				);
			}

			return [...currentItems, { product, quantity: safeQuantity }];
		});
	}

	function updateQuantity(productId: string, quantity: number) {
		setItems((currentItems) =>
			currentItems.flatMap((item) => {
				if (item.product.id !== productId) {
					return [item];
				}

				const nextQuantity = Math.min(
					Math.max(quantity, 0),
					item.product.availableQuantity,
				);
				return nextQuantity === 0 ? [] : [{ ...item, quantity: nextQuantity }];
			}),
		);
	}

	function removeItem(productId: string) {
		setItems((currentItems) =>
			currentItems.filter((item) => item.product.id !== productId),
		);
	}

	function clearCart() {
		setItems([]);
	}

	return (
		<CartContext.Provider
			value={{
				items,
				itemCount,
				totalAmount,
				currency,
				addItem,
				updateQuantity,
				removeItem,
				clearCart,
			}}
		>
			{children}
		</CartContext.Provider>
	);
}

export function useCart() {
	const context = useContext(CartContext);

	if (!context) {
		throw new Error("useCart must be used within CartProvider");
	}

	return context;
}
