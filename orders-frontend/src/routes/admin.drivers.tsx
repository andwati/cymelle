import { createFileRoute } from "@tanstack/react-router";
import { AdminDriversPage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/admin/drivers")({
	component: AdminDriversPage,
});
