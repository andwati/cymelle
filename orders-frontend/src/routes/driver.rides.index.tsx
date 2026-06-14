import { createFileRoute } from "@tanstack/react-router";
import { DriverRidesPage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/driver/rides/")({
	component: DriverRidesPage,
});
