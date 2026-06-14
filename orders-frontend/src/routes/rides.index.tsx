import { createFileRoute } from "@tanstack/react-router";
import { CustomerRidesPage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/rides/")({
	component: CustomerRidesPage,
});
