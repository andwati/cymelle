import { createFileRoute } from "@tanstack/react-router";
import { CustomerOrdersPage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/orders/status")({
	component: () => <CustomerOrdersPage status="SHIPPED" />,
});
