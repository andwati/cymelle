import { createFileRoute } from "@tanstack/react-router";
import {
	AdminOverviewPage,
	CustomerOverviewPage,
	DriverOverviewPage,
} from "#/components/app/WorkspacePages";
import { StoreHome } from "#/components/store/StoreHome";
import { useAuth } from "#/hooks/useAuth";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	const { user } = useAuth();

	if (!user) {
		return <StoreHome />;
	}

	if (user.role === "ADMIN") {
		return <AdminOverviewPage />;
	}

	if (user.role === "DRIVER") {
		return <DriverOverviewPage />;
	}

	return <CustomerOverviewPage />;
}
