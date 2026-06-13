import {Badge} from "#/components/ui/badge";
import {cn} from "#/lib/utils";

type StatusBadgeProps = {
    status: string;
    label?: string;
};

export function StatusBadge({status, label = status}: StatusBadgeProps) {
    return (
        <Badge variant="outline" className={cn("border font-semibold", statusColorClass(status))}>
            {label}
        </Badge>
    );
}

export function statusColorClass(status: string) {
    switch (status) {
        case "ACTIVE":
        case "ENABLED":
        case "IN_STOCK":
        case "DELIVERED":
        case "COMPLETED":
            return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300";
        case "PENDING":
        case "REQUESTED":
        case "LOW_STOCK":
            return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300";
        case "SHIPPED":
        case "ACCEPTED":
            return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-300";
        case "ADMIN":
            return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/50 dark:text-violet-300";
        case "CUSTOMER":
            return "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/50 dark:text-cyan-300";
        case "DRIVER":
            return "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300";
        case "CANCELLED":
        case "INACTIVE":
        case "DISABLED":
        case "OUT_OF_STOCK":
            return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300";
        default:
            return "border-border bg-muted text-muted-foreground";
    }
}
