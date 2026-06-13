import {QuantityStepper} from "#/components/store/QuantityStepper";
import {Button} from "#/components/ui/button";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "#/components/ui/card";
import {StatusBadge} from "#/components/ui/status-badge";
import {formatCurrency} from "#/hooks/formatCurrency";
import type {Product} from "#/types/product";
import {Link} from "@tanstack/react-router";
import {ShoppingCart} from "lucide-react";
import {useState} from "react";
import {toast} from "sonner";

type ProductCardProps = {
    product: Product;
    onAddToCart?: (product: Product, quantity: number) => void;
};

export function ProductCard({product, onAddToCart}: ProductCardProps) {
    const [quantity, setQuantity] = useState(1);
    const inStock = product.availableQuantity > 0;

    return (
        <Card className="gap-4">
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle>{product.name}</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <StatusBadge status={inStock ? "IN_STOCK" : "OUT_OF_STOCK"} label={inStock ? "In stock" : "Out"}/>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-2xl font-semibold">{formatCurrency(product.price, product.currency)}</p>
                <p className="text-sm text-muted-foreground">{product.availableQuantity} available</p>
                {onAddToCart ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <QuantityStepper
                            value={Math.min(quantity, Math.max(product.availableQuantity, 1))}
                            min={1}
                            max={Math.max(product.availableQuantity, 1)}
                            disabled={!inStock}
                            onChange={setQuantity}
                        />
                        <Button
                            type="button"
                            disabled={!inStock}
                            onClick={() => {
                                onAddToCart(product, quantity);
                                toast.success("Added to cart", {
                                    description: `${quantity} x ${product.name}`,
                                });
                            }}
                        >
                            <ShoppingCart/>
                            Add
                        </Button>
                    </div>
                ) : null}
            </CardContent>
            <CardFooter>
                <Button asChild variant="outline" className="w-full">
                    <Link to="/products/$productId" params={{productId: product.id}}>
                        View details
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
