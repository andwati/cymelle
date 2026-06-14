import { ProductCard } from "#/components/store/ProductCard";
import { LoadingState } from "#/components/ui/LoadingState";
import type { Product } from "#/types/product";

type ProductGridProps = {
	products: Product[];
	isLoading: boolean;
	onAddToCart?: (product: Product, quantity: number) => void;
};

export function ProductGrid({
	products,
	isLoading,
	onAddToCart,
}: ProductGridProps) {
	if (isLoading) {
		return <LoadingState title="Loading products" />;
	}

	if (products.length === 0) {
		return (
			<div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
				No products available.
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{products.map((product) => (
				<ProductCard
					key={product.id}
					product={product}
					onAddToCart={onAddToCart}
				/>
			))}
		</div>
	);
}
