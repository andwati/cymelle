import {CustomerRidesPage} from "#/components/app/WorkspacePages";
import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/rides/")({
    component: CustomerRidesPage,
});
