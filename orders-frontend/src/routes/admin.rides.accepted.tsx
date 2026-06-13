import {AdminRidesPage} from "#/components/app/WorkspacePages";
import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/admin/rides/accepted")({
    component: () => <AdminRidesPage status="ACCEPTED"/>,
});
