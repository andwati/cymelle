import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { ThemeToggle } from "#/components/theme-toggle.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Separator } from "#/components/ui/separator.tsx";
import { SidebarTrigger } from "#/components/ui/sidebar.tsx";
import { useCart } from "#/hooks/useCart.tsx";

type SiteHeaderProps = {
	title: string;
	onLogout: () => void;
	showCart?: boolean;
};

export function SiteHeader({
	title,
	onLogout,
	showCart = false,
}: SiteHeaderProps) {
	const cart = useCart();

	return (
		<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mx-2 data-[orientation=vertical]:h-4"
				/>
				<h1 className="text-base font-medium">{title}</h1>
				<div className="ml-auto flex items-center gap-2">
					<ThemeToggle />
					{showCart ? (
						<Button asChild variant="outline" size="sm">
							<Link to="/cart">
								<ShoppingCart />
								Cart ({cart.itemCount})
							</Link>
						</Button>
					) : null}
					<Button type="button" variant="outline" size="sm" onClick={onLogout}>
						Sign out
					</Button>
				</div>
			</div>
		</header>
	);
}
