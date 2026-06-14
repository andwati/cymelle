import { createFileRoute } from "@tanstack/react-router";
import { CustomerOrdersPage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/orders/")({
	component: CustomerOrdersPage,
});
