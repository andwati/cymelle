import { createFileRoute } from "@tanstack/react-router";
import { AdminUsersPage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/admin/users")({
	component: AdminUsersPage,
});
