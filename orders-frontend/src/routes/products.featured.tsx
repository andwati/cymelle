import { createFileRoute } from "@tanstack/react-router";
import { ProductListingPage } from "#/components/app/WorkspacePages";

export const Route = createFileRoute("/products/featured")({
	component: () => <ProductListingPage featured />,
});
