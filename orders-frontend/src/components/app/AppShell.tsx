import {AppSidebar} from "#/components/app-sidebar";
import {SiteHeader} from "#/components/site-header";
import {StoreHome} from "#/components/store/StoreHome";
import {Card, CardContent, CardHeader} from "#/components/ui/card";
import {Skeleton} from "#/components/ui/skeleton";
import {SidebarInset, SidebarProvider} from "#/components/ui/sidebar";
import {useAuth} from "#/hooks/useAuth";
import type {Role} from "#/types/auth";
import type {CSSProperties, ReactNode} from "react";

type AppShellProps = {
    title: string;
    allowedRoles?: Role[];
    showCart?: boolean;
    children: ReactNode;
};

export function AppShell({title, allowedRoles, showCart = false, children}: AppShellProps) {
    const {user, isLoading, logout} = useAuth();

    if (isLoading && !user) {
        return <WorkspaceSkeleton/>;
    }

    if (!user) {
        return <StoreHome/>;
    }

    const allowed = !allowedRoles || allowedRoles.includes(user.role);

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "18rem",
                "--header-height": "3.5rem",
            } as CSSProperties}
        >
            <AppSidebar user={user} onLogout={logout} variant="inset"/>
            <SidebarInset>
                <SiteHeader title={title} onLogout={logout} showCart={showCart || user.role === "CUSTOMER"}/>
                <main className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                    {allowed ? children : <AccessDenied/>}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

function WorkspaceSkeleton() {
    return (
        <main className="min-h-screen bg-background p-4 md:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48"/>
                    <Skeleton className="h-9 w-32"/>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-28"/>
                    <Skeleton className="h-28"/>
                    <Skeleton className="h-28"/>
                </div>
                <Skeleton className="h-80"/>
            </div>
        </main>
    );
}

function AccessDenied() {
    return (
        <Card>
            <CardHeader>
                <h2 className="text-lg font-semibold">This page is not available for your role</h2>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Switch to the correct account type to view this workspace.
                </p>
            </CardContent>
        </Card>
    );
}
