import type {QueryClient} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {createRootRouteWithContext, HeadContent, Outlet, Scripts,} from "@tanstack/react-router";
import {TanStackRouterDevtools} from "@tanstack/react-router-devtools";
import appCss from "#/styles.css?url";
import {AuthProvider} from "#/hooks/useAuth";
import {CartProvider} from "#/hooks/useCart";
import {Toaster} from "#/components/ui/sonner";
import {TooltipProvider} from "#/components/ui/tooltip";
import {ThemeProvider} from "#/components/theme-provider";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Orders Dashboard",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	component: RootComponent,
});

function RootComponent() {
	return (
		<html lang="en" suppressHydrationWarning>
		<head>
			<HeadContent/>
		</head>
		<body>
		<ThemeProvider>
		<TooltipProvider>
		<AuthProvider>
			<CartProvider>
			<Outlet/>
			</CartProvider>
		</AuthProvider>
		</TooltipProvider>
		</ThemeProvider>
		<Toaster richColors position="top-right"/>
		<TanStackRouterDevtools position="bottom-right"/>
		<ReactQueryDevtools initialIsOpen={false}/>
		<Scripts/>
		</body>
		</html>
	);
}
