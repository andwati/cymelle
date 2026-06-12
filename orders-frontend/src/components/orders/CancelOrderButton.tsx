import {useCancelOrder} from "#/hooks/useOrders";
import type {OrderStatus} from "#/types/order";

type Props = {
    orderId: string;
    status: OrderStatus;
};

export function CancelOrderButton({orderId, status}: Props) {
    const cancelMutation = useCancelOrder();

    if (status !== "PLACED") {
        return <span className="text-sm text-slate-400">—</span>;
    }

    function handleCancel() {
        const confirmed = window.confirm(
            "Cancel this order? Stock will be rolled back.",
        );

        if (!confirmed) {
            return;
        }

        cancelMutation.mutate(orderId);
    }

    return (
        <div className="space-y-1">
            <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={handleCancel}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {cancelMutation.isPending ? "Cancelling..." : "Cancel"}
            </button>

            {cancelMutation.error ? (
                <p className="text-xs text-red-600">
                    {cancelMutation.error instanceof Error
                        ? cancelMutation.error.message
                        : "Failed to cancel order"}
                </p>
            ) : null}
        </div>
    );
}