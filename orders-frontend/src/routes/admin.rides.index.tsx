import { createFileRoute } from "@tanstack/react-router";
import { AdminRidesPage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/admin/rides/")({
	component: AdminRidesPage,
});
