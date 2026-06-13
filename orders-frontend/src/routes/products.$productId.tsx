import {AppShell} from "#/components/app/AppShell";
import {QuantityStepper} from "#/components/store/QuantityStepper";
import {SiteHeader} from "#/components/store/SiteHeader";
import {ErrorState} from "#/components/ui/ErrorState";
import {LoadingState} from "#/components/ui/LoadingState";
import {Button} from "#/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "#/components/ui/card";
import {Separator} from "#/components/ui/separator";
import {StatusBadge} from "#/components/ui/status-badge";
import {formatCurrency} from "#/hooks/formatCurrency";
import {useAuth} from "#/hooks/useAuth";
import {useCart} from "#/hooks/useCart";
import {useProduct} from "#/hooks/useProducts";
import {Link, createFileRoute} from "@tanstack/react-router";
import {ShoppingCart} from "lucide-react";
import {useState, type ReactNode} from "react";
import {toast} from "sonner";

export const Route = createFileRoute("/products/$productId")({
    component: ProductDetailPage,
});

function ProductDetailPage() {
    const {productId} = Route.useParams();
    const productQuery = useProduct(productId);
    const {user} = useAuth();
    const cart = useCart();
    const [quantity, setQuantity] = useState(1);

    if (productQuery.isLoading) {
        return <ProductDetailFrame user={user} title="Product detail"><LoadingState title="Loading product"/></ProductDetailFrame>;
    }

    if (productQuery.isError || !productQuery.data) {
        return (
            <ProductDetailFrame user={user} title="Product detail">
                <ErrorState
                    title="Could not load product"
                    message={productQuery.error instanceof Error ? productQuery.error.message : "Product was not found"}
                    onRetry={() => productQuery.refetch()}
                />
            </ProductDetailFrame>
        );
    }

    const product = productQuery.data;
    const inStock = product.availableQuantity > 0;
    const maxQuantity = Math.max(product.availableQuantity, 1);

    function addToCart() {
        cart.addItem(product, quantity);
        toast.success("Added to cart", {description: `${quantity} x ${product.name}`});
    }

    return (
        <ProductDetailFrame user={user} title={product.name}>
                <nav className="mb-6 flex gap-3 text-sm font-medium">
                    <Button asChild variant="link" className="h-auto p-0">
                        <Link to="/">Store</Link>
                    </Button>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{product.name}</span>
                </nav>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium uppercase text-muted-foreground">{product.sku}</p>
                                    <CardTitle className="mt-2 text-3xl">{product.name}</CardTitle>
                                </div>
                                <StatusBadge status={inStock ? "IN_STOCK" : "OUT_OF_STOCK"} label={inStock ? "In stock" : "Out of stock"}/>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-3xl font-semibold">
                                {formatCurrency(product.price, product.currency)}
                            </p>
                            <Separator/>
                            <dl className="grid gap-3 text-sm md:grid-cols-3">
                                <Metric label="Available" value={String(product.availableQuantity)}/>
                                <Metric label="Reorder level" value={String(product.reorderLevel)}/>
                                <Metric label="Currency" value={product.currency}/>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle>Add to cart</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <QuantityStepper
                                value={Math.min(quantity, maxQuantity)}
                                min={1}
                                max={maxQuantity}
                                disabled={!inStock}
                                onChange={setQuantity}
                            />
                            <Button type="button" disabled={!inStock} onClick={addToCart} className="w-full">
                                <ShoppingCart/>
                                Add to cart
                            </Button>
                            <Button asChild variant="outline" className="w-full">
                                <Link to="/cart">View cart ({cart.itemCount})</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
        </ProductDetailFrame>
    );
}

function ProductDetailFrame({
    user,
    title,
    children,
}: {
    user: ReturnType<typeof useAuth>["user"];
    title: string;
    children: ReactNode;
}) {
    const {logout} = useAuth();

    if (user) {
        return <AppShell title={title} showCart>{children}</AppShell>;
    }

    return (
        <main className="min-h-screen bg-background">
            <SiteHeader user={user} onLogout={logout}/>
            <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
        </main>
    );
}

function Metric({label, value}: {label: string; value: string}) {
    return (
        <div className="rounded-lg border border-border p-4">
            <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-semibold">{value}</dd>
        </div>
    );
}
