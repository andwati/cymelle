import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { SiteHeader } from "#/components/store/SiteHeader";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { useAuth } from "#/hooks/useAuth";
import { useCart } from "#/hooks/useCart";
import { useVerifyPaystackPayment } from "#/hooks/usePayments";

export const Route = createFileRoute("/payments/paystack/callback")({
	validateSearch: (search: Record<string, unknown>) => ({
		reference: typeof search.reference === "string" ? search.reference : "",
	}),
	component: PaystackCallbackPage,
});

function PaystackCallbackPage() {
	const { user, logout } = useAuth();
	const cart = useCart();
	const navigate = useNavigate();
	const { reference } = Route.useSearch();
	const verifyPayment = useVerifyPaystackPayment();
	const startedRef = useRef(false);

	useEffect(() => {
		if (!reference || startedRef.current) {
			return;
		}

		startedRef.current = true;
		verifyPayment.mutate(reference, {
			onSuccess: (payment) => {
				if (payment.status === "PAID") {
					cart.clearCart();
					toast.success("Payment verified", {
						description: `Order ${payment.orderId.slice(0, 8)} is ready for fulfillment.`,
					});
					return;
				}

				toast.error("Payment not completed", {
					description: payment.message,
				});
			},
			onError: (error) => {
				toast.error("Payment verification failed", {
					description:
						error instanceof Error
							? error.message
							: "Please contact support with your reference.",
				});
			},
		});
	}, [cart, reference, verifyPayment]);

	const paid = verifyPayment.data?.status === "PAID";
	const failed =
		!reference ||
		verifyPayment.isError ||
		(verifyPayment.data && verifyPayment.data.status !== "PAID");

	return (
		<main className="min-h-screen bg-background">
			<SiteHeader
				user={user}
				onLogin={() => navigate({ to: "/cart" })}
				onRegister={() => navigate({ to: "/cart" })}
				onLogout={logout}
			/>

			<div className="mx-auto flex max-w-2xl px-4 py-12">
				<Card className="w-full">
					<CardContent className="space-y-5 p-6">
						{verifyPayment.isPending ? (
							<div className="flex items-center gap-3">
								<Loader2 className="size-5 animate-spin text-muted-foreground" />
								<div>
									<h1 className="text-xl font-semibold">Verifying payment</h1>
									<p className="text-sm text-muted-foreground">
										Reference {reference}
									</p>
								</div>
							</div>
						) : null}

						{paid ? (
							<div className="rounded-md border p-4">
								<div className="flex gap-3">
									<CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
									<div>
										<h1 className="font-semibold">Payment verified</h1>
										<p className="text-sm text-muted-foreground">
											Order {verifyPayment.data?.orderId.slice(0, 8)} is pending
											fulfillment.
										</p>
									</div>
								</div>
							</div>
						) : null}

						{failed ? (
							<div className="rounded-md border border-destructive/40 p-4 text-destructive">
								<div className="flex gap-3">
									<XCircle className="mt-0.5 size-4" />
									<div>
										<h1 className="font-semibold">
											Payment could not be verified
										</h1>
										<p className="text-sm">
											{reference
												? (verifyPayment.data?.message ??
													verifyPayment.error?.message ??
													"Please contact support with your reference.")
												: "The Paystack callback did not include a reference."}
										</p>
									</div>
								</div>
							</div>
						) : null}

						<div className="flex flex-col gap-2 sm:flex-row">
							<Button asChild>
								<Link to="/orders">View orders</Link>
							</Button>
							<Button asChild variant="outline">
								<Link to="/cart">Back to cart</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
