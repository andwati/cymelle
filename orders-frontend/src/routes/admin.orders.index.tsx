import {AdminOrdersPage} from "#/components/app/WorkspacePages";
import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/admin/orders/")({
    component: AdminOrdersPage,
});
