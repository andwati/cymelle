import {DriverRidesPage} from "#/components/app/WorkspacePages";
import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/driver/rides/requested")({
    component: () => <DriverRidesPage status="REQUESTED"/>,
});
