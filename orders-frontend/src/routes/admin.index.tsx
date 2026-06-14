import { createFileRoute } from "@tanstack/react-router";
import { AdminOverviewPage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/admin/")({
	component: AdminOverviewPage,
});
