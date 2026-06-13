import {CustomerRideRequestPage} from "#/components/app/WorkspacePages";
import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/rides/new")({
    component: CustomerRideRequestPage,
});
