import { createFileRoute } from "@tanstack/react-router";
import { AdminCustomersPage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/admin/customers")({
	component: AdminCustomersPage,
});
