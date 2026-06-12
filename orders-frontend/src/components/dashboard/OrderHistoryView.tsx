import {OrderFilters} from "#/components/orders/OrderFilters";
import {OrderHistoryTable} from "#/components/orders/OrderHistoryTable";
import {EmptyState} from "#/components/ui/EmptyState";
import {ErrorState} from "#/components/ui/ErrorState";
import {LoadingState} from "#/components/ui/LoadingState";
import {useOrders} from "#/hooks/useOrders";
import type {OrderFilters as OrderFiltersType} from "#/types/order";
import {useState} from "react";

export function OrderHistoryView() {
    const [filters, setFilters] = useState<OrderFiltersType>({
        status: "",
        from: "",
        to: "",
    });

    const ordersQuery = useOrders(filters);

    return (
        <section className="space-y-4">
            <OrderFilters filters={filters} onChange={setFilters}/>

            {ordersQuery.isLoading ? (
                <LoadingState
                    title="Loading order history"
                    description="Fetching orders matching your filters."
                />
            ) : null}

            {ordersQuery.isError ? (
                <ErrorState
                    title="Could not load order history"
                    message={
                        ordersQuery.error instanceof Error
                            ? ordersQuery.error.message
                            : "Failed to load order history"
                    }
                    onRetry={() => ordersQuery.refetch()}
                />
            ) : null}

            {!ordersQuery.isLoading &&
            !ordersQuery.isError &&
            ordersQuery.data?.items.length === 0 ? (
                <EmptyState
                    title="No orders found"
                    description="Try changing the status or date range filters."
                />
            ) : null}

            {!ordersQuery.isLoading &&
            !ordersQuery.isError &&
            ordersQuery.data &&
            ordersQuery.data.items.length > 0 ? (
                <>
                    {ordersQuery.isFetching ? (
                        <p className="text-sm text-slate-500">Refreshing order history...</p>
                    ) : null}

                    <OrderHistoryTable orders={ordersQuery.data.items}/>

                    <p className="text-sm text-slate-500">
                        Showing {ordersQuery.data.items.length} of{" "}
                        {ordersQuery.data.totalItems} orders.
                    </p>
                </>
            ) : null}
        </section>
    );
}