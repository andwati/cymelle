import { createFileRoute } from "@tanstack/react-router";
import { AdminInventoryPage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/admin/inventory")({
	component: AdminInventoryPage,
});
