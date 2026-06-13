import {CustomerOrdersPage} from "#/components/app/WorkspacePages";
import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/orders/status")({
    component: () => <CustomerOrdersPage status="SHIPPED"/>,
});
