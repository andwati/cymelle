import { createFileRoute } from "@tanstack/react-router";
import { AdminProductsPage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/admin/products/")({
	component: AdminProductsPage,
});
