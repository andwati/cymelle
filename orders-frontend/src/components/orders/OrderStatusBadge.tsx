import {cn} from "#/lib/utils";
import type {OrderStatus} from "#/types/order";

type Props = {
    status: OrderStatus;
};

export function OrderStatusBadge({status}: Props) {
    return (
        <span
            className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                status === "PLACED" && "bg-blue-50 text-blue-700",
                status === "CANCELLED" && "bg-slate-100 text-slate-600",
            )}
        >
      {status === "PLACED" ? "Placed" : "Cancelled"}
    </span>
    );
}