import {DriverRidesPage} from "#/components/app/WorkspacePages";
import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/driver/rides/completed")({
    component: () => <DriverRidesPage status="COMPLETED"/>,
});
