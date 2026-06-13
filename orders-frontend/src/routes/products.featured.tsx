import {ProductListingPage} from "#/components/app/WorkspacePages";
import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/products/featured")({
    component: () => <ProductListingPage featured/>,
});
