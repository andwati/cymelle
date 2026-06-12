import {InventoryStatusBadge} from "#/components/inventory/InventoryStatusBadge";
import type {InventoryItem} from "#/types/inventory";
import {formatDate} from "#/hooks/formatDate";

type Props = {
    items: InventoryItem[];
};

export function InventoryTable({items}: Props) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Available</th>
                    <th className="px-4 py-3">Reserved</th>
                    <th className="px-4 py-3">Reorder Level</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Updated</th>
                </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                            {item.productName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.sku}</td>
                        <td className="px-4 py-3 text-slate-900">
                            {item.availableQuantity}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                            {item.reservedQuantity}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                            {item.reorderLevel}
                        </td>
                        <td className="px-4 py-3">
                            <InventoryStatusBadge status={item.status}/>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                            {formatDate(item.updatedAt)}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}