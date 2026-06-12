import {InventoryTable} from "#/components/inventory/InventoryTable";
import {EmptyState} from "#/components/ui/EmptyState";
import {LoadingState} from "#/components/ui/LoadingState";
import {useInventory} from "#/hooks/useInventory";
import {ErrorState} from "#/components/ui/ErrorState.tsx";

export function InventoryView() {
    const inventoryQuery = useInventory();

    if (inventoryQuery.isLoading) {
        return (
            <LoadingState
                title="Loading inventory"
                description="Fetching current stock levels."
            />
        );
    }

    if (inventoryQuery.isError) {
        return (
            <ErrorState
                title="Could not load inventory"
                message={
                    inventoryQuery.error instanceof Error
                        ? inventoryQuery.error.message
                        : "Failed to load inventory"
                }
                onRetry={() => inventoryQuery.refetch()}
            />
        );
    }

    const items = inventoryQuery.data?.items ?? [];

    if (items.length === 0) {
        return (
            <EmptyState
                title="No inventory found"
                description="Inventory records will appear here once products are seeded or added."
            />
        );
    }

    const lowStockCount = items.filter((item) => item.status === "LOW_STOCK").length;
    const outOfStockCount = items.filter(
        (item) => item.status === "OUT_OF_STOCK",
    ).length;

    return (
        <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Total products</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {items.length}
                    </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">Low stock</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-900">
                        {lowStockCount}
                    </p>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-700">Out of stock</p>
                    <p className="mt-2 text-2xl font-semibold text-red-900">
                        {outOfStockCount}
                    </p>
                </div>
            </div>

            {inventoryQuery.isFetching ? (
                <p className="text-sm text-slate-500">Refreshing inventory...</p>
            ) : null}

            <InventoryTable items={items}/>
        </section>
    );
}