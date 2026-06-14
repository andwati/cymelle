import { createFileRoute } from "@tanstack/react-router";
import { AdminOrdersPage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/admin/orders/pending")({
	component: () => <AdminOrdersPage status="PENDING" />,
});
