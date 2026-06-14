import { createFileRoute } from "@tanstack/react-router";
import { AdminProductCreatePage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/admin/products/new")({
	component: AdminProductCreatePage,
});
