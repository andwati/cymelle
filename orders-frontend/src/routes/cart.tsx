import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CreditCard, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "#/api/client";
import { AuthDialog } from "#/components/store/AuthDialog";
import { QuantityStepper } from "#/components/store/QuantityStepper";
import { SiteHeader } from "#/components/store/SiteHeader";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { ErrorState } from "#/components/ui/ErrorState";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { formatCurrency } from "#/hooks/formatCurrency";
import { useAuth } from "#/hooks/useAuth";
import { useCart } from "#/hooks/useCart";
import { useCheckoutQuote, useSimulateCheckout } from "#/hooks/usePayments";
import { navigateToRoleHome } from "#/lib/auth-navigation";

export const Route = createFileRoute("/cart")({
	component: CartPage,
});

function CartPage() {
	const cart = useCart();
	const { user, login, register, logout } = useAuth();
	const navigate = useNavigate();
	const simulateCheckout = useSimulateCheckout();
	const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
	const [requestRide, setRequestRide] = useState(false);
	const [rideForm, setRideForm] = useState({
		pickupLocation: "",
		dropoffLocation: "",
		distanceKm: "5",
	});
	const rideFormIsValid =
		!requestRide ||
		(rideForm.pickupLocation.trim().length > 0 &&
			rideForm.dropoffLocation.trim().length > 0 &&
			Number(rideForm.distanceKm) > 0);
	const checkoutRequest = useMemo(
		() => ({
			items: cart.items.map((item) => ({
				productId: item.product.id,
				quantity: item.quantity,
			})),
			deliveryRide:
				requestRide && rideFormIsValid
					? {
							pickupLocation: rideForm.pickupLocation,
							dropoffLocation: rideForm.dropoffLocation,
							distanceKm: Number(rideForm.distanceKm),
						}
					: null,
		}),
		[
			cart.items,
			requestRide,
			rideForm.dropoffLocation,
			rideForm.distanceKm,
			rideForm.pickupLocation,
			rideFormIsValid,
		],
	);
	const checkoutQuote = useCheckoutQuote(
		checkoutRequest,
		cart.items.length > 0 && rideFormIsValid,
	);
	const productSubtotal =
		checkoutQuote.data?.productSubtotal ?? cart.totalAmount;
	const rideFare = requestRide ? (checkoutQuote.data?.rideFare ?? 0) : 0;
	const grandTotal =
		checkoutQuote.data?.grandTotal ?? productSubtotal + rideFare;
	const currency = checkoutQuote.data?.currency ?? cart.currency;

	async function handleLogin(request: { username: string; password: string }) {
		const user = await login(request);
		setAuthMode(null);
		toast.success("Signed in", { description: "Opening your dashboard." });
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
		toast.success("Account created", {
			description: "Opening your dashboard.",
		});
		await navigateToRoleHome(navigate, user);
		return user;
	}

	async function checkout() {
		if (!user) {
			setAuthMode("login");
			toast.info("Sign in to checkout", {
				description: "Your cart will stay here after authentication.",
			});
			return;
		}

		if (user.role !== "CUSTOMER") {
			toast.error("Checkout requires a customer account");
			return;
		}

		if (
			requestRide &&
			(!rideForm.pickupLocation ||
				!rideForm.dropoffLocation ||
				Number(rideForm.distanceKm) <= 0)
		) {
			toast.error(
				"Pickup, dropoff, and distance are required for a delivery ride",
			);
			return;
		}

		try {
			const checkout = await simulateCheckout.mutateAsync(checkoutRequest);
			cart.clearCart();
			toast.success("Checkout complete", {
				description: `Order ${checkout.orderId.slice(0, 8)} is ready for fulfillment.`,
			});
			await navigate({ to: "/orders" });
		} catch (error) {
			if (error instanceof ApiError && error.status === 403) {
				await logout();
				setAuthMode("login");
				toast.error("Sign in again", {
					description: "Your session expired before checkout.",
				});
				return;
			}

			toast.error("Checkout failed", {
				description:
					error instanceof Error
						? error.message
						: "Please review your cart and try again.",
			});
		}
	}

	return (
		<main className="min-h-screen bg-background">
			<SiteHeader
				user={user}
				onLogin={() => setAuthMode("login")}
				onRegister={() => setAuthMode("register")}
				onLogout={logout}
			/>

			<div className="mx-auto max-w-6xl px-4 py-8">
				<div className="mb-6">
					<p className="text-sm font-medium uppercase text-muted-foreground">
						Checkout
					</p>
					<h1 className="mt-2 text-3xl font-bold">Cart</h1>
				</div>

				{cart.items.length === 0 ? (
					<Card>
						<CardContent className="py-10 text-center">
							<ShoppingCart className="mx-auto mb-3 size-8 text-muted-foreground" />
							<p className="font-medium">Your cart is empty.</p>
							<Button asChild className="mt-4">
								<Link to="/">Browse products</Link>
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
						<div className="space-y-3">
							{cart.items.map((item) => (
								<Card key={item.product.id}>
									<CardContent className="p-4">
										<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
											<div>
												<Button
													asChild
													variant="link"
													className="h-auto p-0 text-base font-semibold"
												>
													<Link
														to="/products/$productId"
														params={{ productId: item.product.id }}
													>
														{item.product.name}
													</Link>
												</Button>
												<p className="mt-1 text-sm text-muted-foreground">
													{item.product.sku}
												</p>
												<p className="mt-2 text-sm">
													{formatCurrency(
														item.product.price,
														item.product.currency,
													)}{" "}
													each
												</p>
											</div>
											<div className="flex items-center gap-3">
												<QuantityStepper
													value={item.quantity}
													min={1}
													max={item.product.availableQuantity}
													onChange={(quantity) =>
														cart.updateQuantity(item.product.id, quantity)
													}
												/>
												<Button
													type="button"
													variant="destructive"
													size="icon"
													onClick={() => {
														cart.removeItem(item.product.id);
														toast.info("Removed from cart");
													}}
													aria-label={`Remove ${item.product.name}`}
												>
													<Trash2 />
												</Button>
											</div>
										</div>
										<p className="mt-4 text-right font-semibold">
											{formatCurrency(
												item.product.price * item.quantity,
												item.product.currency,
											)}
										</p>
									</CardContent>
								</Card>
							))}
						</div>

						<Card className="h-fit">
							<CardHeader>
								<CardTitle>Order summary</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Items</span>
									<span className="font-medium">{cart.itemCount}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">
										Product subtotal
									</span>
									<span className="font-medium">
										{formatCurrency(productSubtotal, currency)}
									</span>
								</div>
								<Separator />
								<div className="space-y-3 rounded-lg border p-3">
									<label className="flex items-center gap-2 text-sm font-medium">
										<input
											type="checkbox"
											checked={requestRide}
											onChange={(event) => setRequestRide(event.target.checked)}
										/>
										Request delivery ride with this order
									</label>
									{requestRide ? (
										<div className="grid gap-3">
											<div className="space-y-2">
												<Label htmlFor="checkout-pickup">Pickup</Label>
												<Input
													id="checkout-pickup"
													value={rideForm.pickupLocation}
													onChange={(event) =>
														setRideForm({
															...rideForm,
															pickupLocation: event.target.value,
														})
													}
													required={requestRide}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="checkout-dropoff">Dropoff</Label>
												<Input
													id="checkout-dropoff"
													value={rideForm.dropoffLocation}
													onChange={(event) =>
														setRideForm({
															...rideForm,
															dropoffLocation: event.target.value,
														})
													}
													required={requestRide}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="checkout-distance">Distance KM</Label>
												<Input
													id="checkout-distance"
													type="number"
													min="0.1"
													step="0.1"
													value={rideForm.distanceKm}
													onChange={(event) =>
														setRideForm({
															...rideForm,
															distanceKm: event.target.value,
														})
													}
													required={requestRide}
												/>
											</div>
										</div>
									) : null}
								</div>
								{requestRide ? (
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Delivery ride</span>
										<span className="font-medium">
											{checkoutQuote.isFetching
												? "Calculating..."
												: formatCurrency(rideFare, currency)}
										</span>
									</div>
								) : null}
								<Separator />
								<div className="flex justify-between text-lg font-semibold">
									<span>Total</span>
									<span>{formatCurrency(grandTotal, currency)}</span>
								</div>
								<Button
									type="button"
									disabled={simulateCheckout.isPending}
									onClick={checkout}
									className="w-full"
								>
									<CreditCard className="mr-2 size-4" />
									{simulateCheckout.isPending
										? "Completing checkout..."
										: "Simulate checkout"}
								</Button>
								{!user ? (
									<div className="grid grid-cols-2 gap-2">
										<Button
											type="button"
											variant="outline"
											onClick={() => setAuthMode("login")}
										>
											Sign in
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={() => setAuthMode("register")}
										>
											Create account
										</Button>
									</div>
								) : null}
								{checkoutQuote.error ? (
									<ErrorState
										message={
											checkoutQuote.error instanceof Error
												? checkoutQuote.error.message
												: "Quote failed"
										}
									/>
								) : null}
								{simulateCheckout.error ? (
									<ErrorState
										message={
											simulateCheckout.error instanceof Error
												? simulateCheckout.error.message
												: "Checkout failed"
										}
									/>
								) : null}
							</CardContent>
						</Card>
					</div>
				)}
			</div>

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
