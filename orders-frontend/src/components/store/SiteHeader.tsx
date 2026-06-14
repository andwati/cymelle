import { Link } from "@tanstack/react-router";
import { LogOut, ShoppingCart, User } from "lucide-react";
import { ThemeToggle } from "#/components/theme-toggle";
import { Button } from "#/components/ui/button";
import { useCart } from "#/hooks/useCart";
import type { AuthUser } from "#/types/auth";

type SiteHeaderProps = {
	user?: AuthUser | null;
	onLogin?: () => void;
	onRegister?: () => void;
	onLogout?: () => void;
};

export function SiteHeader({
	user,
	onLogin,
	onRegister,
	onLogout,
}: SiteHeaderProps) {
	const cart = useCart();

	return (
		<header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
			<div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
				<div>
					<Link to="/" className="text-2xl font-bold text-foreground">
						Cymelle
					</Link>
					<p className="text-sm text-muted-foreground">
						Commerce, delivery, and rides
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<ThemeToggle />
					<Button asChild variant="outline">
						<Link to="/cart">
							<ShoppingCart />
							Cart ({cart.itemCount})
						</Link>
					</Button>
					{user ? (
						<>
							<div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
								<User className="size-4" />
								<span>{user.displayName}</span>
							</div>
							<Button type="button" variant="outline" onClick={onLogout}>
								<LogOut />
								Sign out
							</Button>
						</>
					) : (
						<>
							<Button type="button" onClick={onLogin}>
								Sign in
							</Button>
							<Button type="button" variant="outline" onClick={onRegister}>
								Create account
							</Button>
						</>
					)}
				</div>
			</div>
		</header>
	);
}
