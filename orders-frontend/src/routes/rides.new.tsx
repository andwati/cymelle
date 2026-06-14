import { createFileRoute } from "@tanstack/react-router";
import { CustomerRideRequestPage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/rides/new")({
	component: CustomerRideRequestPage,
});
