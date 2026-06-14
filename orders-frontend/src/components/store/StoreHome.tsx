import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthDialog } from "#/components/store/AuthDialog";
import { ProductGrid } from "#/components/store/ProductGrid";
import { SiteHeader } from "#/components/store/SiteHeader";
import { useAuth } from "#/hooks/useAuth";
import { useCart } from "#/hooks/useCart";
import { useProducts } from "#/hooks/useProducts";
import { navigateToRoleHome } from "#/lib/auth-navigation";

export function StoreHome() {
	const { user, login, register, logout } = useAuth();
	const productsQuery = useProducts();
	const cart = useCart();
	const navigate = useNavigate();
	const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);

	async function handleLogin(request: { username: string; password: string }) {
		const user = await login(request);
		setAuthMode(null);
		await navigateToRoleHome(navigate, user);
		return user;
	}

	async function handleRegister(request: {
		username: string;
		password: string;
		displayName: string;
	}) {
		const user = await register(request);
		setAuthMode(null);
		await navigateToRoleHome(navigate, user);
		return user;
	}

	return (
		<main className="min-h-screen bg-background">
			<SiteHeader
				user={user}
				onLogin={() => setAuthMode("login")}
				onRegister={() => setAuthMode("register")}
				onLogout={logout}
			/>
			<section className="mx-auto max-w-7xl px-4 py-8">
				<div className="mb-6 max-w-2xl">
					<p className="text-sm font-medium uppercase text-muted-foreground">
						Store
					</p>
					<h1 className="mt-2 text-4xl font-bold tracking-normal text-foreground">
						Shop Cymelle products
					</h1>
				</div>
				<ProductGrid
					products={productsQuery.data ?? []}
					isLoading={productsQuery.isLoading}
					onAddToCart={cart.addItem}
				/>
			</section>
			<AuthDialog
				open={authMode !== null}
				initialMode={authMode ?? "login"}
				onOpenChange={(open) => !open && setAuthMode(null)}
				onLogin={handleLogin}
				onRegister={handleRegister}
			/>
		</main>
	);
}
