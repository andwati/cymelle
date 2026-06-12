import {CancelOrderButton} from "#/components/orders/CancelOrderButton";
import {OrderStatusBadge} from "#/components/orders/OrderStatusBadge";
import type {OrderSummary} from "#/types/order";
import {formatCurrency} from "#/hooks/formatCurrency";
import {formatDate} from "#/hooks/formatDate";

type Props = {
    orders: OrderSummary[];
};

export function OrderHistoryTable({orders}: Props) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Cancelled</th>
                    <th className="px-4 py-3">Action</th>
                </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                            {order.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                            {order.customerName}
                        </td>
                        <td className="px-4 py-3">
                            <OrderStatusBadge status={order.status}/>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{order.itemCount}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                            {formatCurrency(order.totalAmount, order.currency)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                            {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                            {formatDate(order.cancelledAt)}
                        </td>
                        <td className="px-4 py-3">
                            <CancelOrderButton orderId={order.id} status={order.status}/>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}