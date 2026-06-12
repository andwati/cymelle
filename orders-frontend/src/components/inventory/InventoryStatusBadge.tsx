import {cn} from "#/lib/utils";
import type {InventoryStatus} from "#/types/inventory";

type Props = {
    status: InventoryStatus;
};

const labelMap: Record<InventoryStatus, string> = {
    IN_STOCK: "In stock",
    LOW_STOCK: "Low stock",
    OUT_OF_STOCK: "Out of stock",
};

export function InventoryStatusBadge({status}: Props) {
    return (
        <span
            className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                status === "IN_STOCK" && "bg-emerald-50 text-emerald-700",
                status === "LOW_STOCK" && "bg-amber-50 text-amber-700",
                status === "OUT_OF_STOCK" && "bg-red-50 text-red-700",
            )}
        >
      {labelMap[status]}
    </span>
    );
}