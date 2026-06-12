import type {OrderFilters as OrderFiltersType, OrderStatus,} from "#/types/order";

type Props = {
    filters: OrderFiltersType;
    onChange: (filters: OrderFiltersType) => void;
};

export function OrderFilters({filters, onChange}: Props) {
    function updateFilter<Key extends keyof OrderFiltersType>(
        key: Key,
        value: OrderFiltersType[Key],
    ) {
        onChange({
            ...filters,
            [key]: value,
        });
    }

    return (
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
            <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Status</span>
                <select
                    value={filters.status ?? ""}
                    onChange={(event) =>
                        updateFilter("status", event.target.value as OrderStatus | "")
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                >
                    <option value="">All</option>
                    <option value="PLACED">Placed</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </label>

            <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">From</span>
                <input
                    type="date"
                    value={filters.from ?? ""}
                    onChange={(event) => updateFilter("from", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
            </label>

            <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">To</span>
                <input
                    type="date"
                    value={filters.to ?? ""}
                    onChange={(event) => updateFilter("to", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
            </label>

            <div className="flex items-end">
                <button
                    type="button"
                    onClick={() => onChange({status: "", from: "", to: ""})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Reset filters
                </button>
            </div>
        </div>
    );
}