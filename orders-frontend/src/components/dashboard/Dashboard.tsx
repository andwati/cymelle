import { Link } from "@tanstack/react-router";
import {
	Boxes,
	Car,
	ClipboardList,
	PackagePlus,
	ShoppingCart,
} from "lucide-react";
import {
	type CSSProperties,
	type FormEvent,
	type ReactNode,
	useState,
} from "react";
import { toast } from "sonner";
import { AppSidebar } from "#/components/app-sidebar";
import { SiteHeader } from "#/components/site-header";
import { ProductGrid } from "#/components/store/ProductGrid";
import { QuantityStepper } from "#/components/store/QuantityStepper";
import { StoreHome } from "#/components/store/StoreHome";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { ErrorState } from "#/components/ui/ErrorState";
import { Input } from "#/components/ui/input";
import { LoadingState } from "#/components/ui/LoadingState";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { formatCurrency } from "#/hooks/formatCurrency";
import { formatDate } from "#/hooks/formatDate";
import { useAuth } from "#/hooks/useAuth";
import { useCart } from "#/hooks/useCart";
import { useOrders, useUpdateOrderStatus } from "#/hooks/useOrders";
import {
	useCreateProduct,
	useDeactivateProduct,
	useProducts,
	useUpdateProduct,
} from "#/hooks/useProducts";
import {
	useAcceptRide,
	useCancelRide,
	useCompleteRide,
	useRequestRide,
	useRides,
	useUpdateRideStatus,
} from "#/hooks/useRides";
import type { OrderStatus } from "#/types/order";
import type { Product, ProductRequest } from "#/types/product";
import type { Ride, RideStatus } from "#/types/ride";

const emptyProductForm: ProductRequest = {
	name: "",
	sku: "",
	price: 0,
	currency: "KES",
	active: true,
	availableQuantity: 0,
	reorderLevel: 5,
};

type RideFormState = {
	orderId: string;
	pickupLocation: string;
	dropoffLocation: string;
	distanceKm: string;
};

const emptyRideForm: RideFormState = {
	orderId: "",
	pickupLocation: "",
	dropoffLocation: "",
	distanceKm: "5",
};

export function Dashboard() {
	const { user, logout } = useAuth();

	if (!user) {
		return <StoreHome />;
	}

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "18rem",
					"--header-height": "3.5rem",
				} as CSSProperties
			}
		>
			<AppSidebar user={user} onLogout={logout} variant="inset" />
			<SidebarInset>
				<SiteHeader
					title={dashboardTitle(user.role)}
					onLogout={logout}
					showCart={user.role === "CUSTOMER"}
				/>
				<main className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
					{user.role === "CUSTOMER" ? <CustomerDashboard /> : null}
					{user.role === "ADMIN" ? <AdminDashboard /> : null}
					{user.role === "DRIVER" ? <DriverDashboard /> : null}
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

function dashboardTitle(role: "ADMIN" | "CUSTOMER" | "DRIVER") {
	if (role === "ADMIN") {
		return "Admin dashboard";
	}
	if (role === "DRIVER") {
		return "Driver dashboard";
	}
	return "Customer dashboard";
}

function CustomerDashboard() {
	const productsQuery = useProducts();
	const ordersQuery = useOrders({ status: "", from: "", to: "" });
	const ridesQuery = useRides();
	const requestRide = useRequestRide();
	const cancelRide = useCancelRide();
	const cart = useCart();
	const [rideForm, setRideForm] = useState<RideFormState>(emptyRideForm);

	async function submitRide(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!rideForm.orderId) {
			toast.error("Choose an order before requesting a ride");
			return;
		}

		await requestRide.mutateAsync({
			orderId: rideForm.orderId,
			pickupLocation: rideForm.pickupLocation,
			dropoffLocation: rideForm.dropoffLocation,
			distanceKm: Number(rideForm.distanceKm),
		});
		toast.success("Ride requested");
		setRideForm(emptyRideForm);
	}

	if (productsQuery.isError) {
		return (
			<ErrorState
				message={errorMessage(productsQuery.error)}
				onRetry={() => productsQuery.refetch()}
			/>
		);
	}

	return (
		<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
			<section className="space-y-5">
				<Panel title="Products" icon={<Boxes />}>
					<ProductGrid
						products={productsQuery.data ?? []}
						isLoading={productsQuery.isLoading}
						onAddToCart={cart.addItem}
					/>
				</Panel>

				<Panel title="My orders" icon={<ClipboardList />}>
					<OrderTable
						orders={ordersQuery.data?.items ?? []}
						action={(order) => <OrderStatusBadge status={order.status} />}
					/>
				</Panel>

				<Panel title="My rides" icon={<Car />}>
					<RideRequestForm
						form={rideForm}
						setForm={setRideForm}
						orders={ordersQuery.data?.items ?? []}
						onSubmit={submitRide}
						pending={requestRide.isPending}
					/>
					<RideTable
						rides={ridesQuery.data ?? []}
						action={(ride) =>
							ride.status === "REQUESTED" ? (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										cancelRide.mutate(ride.id, {
											onSuccess: () => toast.success("Ride cancelled"),
										})
									}
								>
									Cancel
								</Button>
							) : null
						}
					/>
				</Panel>
			</section>

			<aside className="space-y-5">
				<Panel title="Cart" icon={<ShoppingCart />}>
					{cart.items.length === 0 ? (
						<p className="text-sm text-muted-foreground">Your cart is empty.</p>
					) : (
						<div className="space-y-4">
							{cart.items.map((item) => (
								<div
									key={item.product.id}
									className="space-y-3 rounded-lg border border-border p-3"
								>
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="font-medium">{item.product.name}</p>
											<p className="text-sm text-muted-foreground">
												{formatCurrency(
													item.product.price,
													item.product.currency,
												)}{" "}
												each
											</p>
										</div>
										<p className="font-semibold">
											{formatCurrency(
												item.product.price * item.quantity,
												item.product.currency,
											)}
										</p>
									</div>
									<QuantityStepper
										value={item.quantity}
										min={0}
										max={item.product.availableQuantity}
										onChange={(quantity) =>
											cart.updateQuantity(item.product.id, quantity)
										}
									/>
								</div>
							))}
							<Separator />
							<div className="flex justify-between font-semibold">
								<span>Total</span>
								<span>{formatCurrency(cart.totalAmount, cart.currency)}</span>
							</div>
							<Button asChild className="w-full">
								<Link to="/cart">View cart</Link>
							</Button>
						</div>
					)}
				</Panel>
			</aside>
		</div>
	);
}

function AdminDashboard() {
	const productsQuery = useProducts();
	const ordersQuery = useOrders({ status: "", from: "", to: "" });
	const ridesQuery = useRides();
	const createProduct = useCreateProduct();
	const updateProduct = useUpdateProduct();
	const deactivateProduct = useDeactivateProduct();
	const updateOrderStatus = useUpdateOrderStatus();
	const updateRideStatus = useUpdateRideStatus();
	const [editing, setEditing] = useState<Product | null>(null);
	const [form, setForm] = useState<ProductRequest>(emptyProductForm);

	function startEdit(product: Product) {
		setEditing(product);
		setForm({
			name: product.name,
			sku: product.sku,
			price: product.price,
			currency: product.currency,
			active: product.active,
			availableQuantity: product.availableQuantity,
			reorderLevel: product.reorderLevel,
		});
	}

	async function submitProduct(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (editing) {
			await updateProduct.mutateAsync({ id: editing.id, request: form });
			toast.success("Product updated");
		} else {
			await createProduct.mutateAsync(form);
			toast.success("Product created");
		}
		setEditing(null);
		setForm(emptyProductForm);
	}

	return (
		<div className="space-y-5">
			<Panel
				title={editing ? "Edit product" : "Add product"}
				icon={<PackagePlus />}
			>
				<ProductForm
					form={form}
					setForm={setForm}
					onSubmit={submitProduct}
					pending={createProduct.isPending || updateProduct.isPending}
				/>
			</Panel>

			<Panel title="Products" icon={<Boxes />}>
				<ProductAdminTable
					products={productsQuery.data ?? []}
					onEdit={startEdit}
					onDeactivate={(id) =>
						deactivateProduct.mutate(id, {
							onSuccess: () => toast.success("Product deactivated"),
						})
					}
				/>
			</Panel>

			<Panel title="Orders" icon={<ClipboardList />}>
				<OrderTable
					orders={ordersQuery.data?.items ?? []}
					action={(order) => (
						<StatusSelect<OrderStatus>
							value={order.status}
							options={["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"]}
							onChange={(status) =>
								updateOrderStatus.mutate(
									{ id: order.id, status },
									{ onSuccess: () => toast.success("Order updated") },
								)
							}
						/>
					)}
				/>
			</Panel>

			<Panel title="Rides" icon={<Car />}>
				<RideTable
					rides={ridesQuery.data ?? []}
					action={(ride) => (
						<StatusSelect<RideStatus>
							value={ride.status}
							options={["REQUESTED", "ACCEPTED", "COMPLETED", "CANCELLED"]}
							onChange={(status) =>
								updateRideStatus.mutate(
									{ id: ride.id, status },
									{ onSuccess: () => toast.success("Ride updated") },
								)
							}
						/>
					)}
				/>
			</Panel>
		</div>
	);
}

function DriverDashboard() {
	const ridesQuery = useRides();
	const acceptRide = useAcceptRide();
	const completeRide = useCompleteRide();

	return (
		<Panel title="Driver rides" icon={<Car />}>
			{ridesQuery.isLoading ? <LoadingState title="Loading rides" /> : null}
			<RideTable
				rides={ridesQuery.data ?? []}
				action={(ride) => {
					if (ride.status === "REQUESTED") {
						return (
							<Button
								type="button"
								size="sm"
								onClick={() =>
									acceptRide.mutate(ride.id, {
										onSuccess: () => toast.success("Ride accepted"),
									})
								}
							>
								Accept
							</Button>
						);
					}
					if (ride.status === "ACCEPTED") {
						return (
							<Button
								type="button"
								size="sm"
								onClick={() =>
									completeRide.mutate(ride.id, {
										onSuccess: () => toast.success("Ride completed"),
									})
								}
							>
								Complete
							</Button>
						);
					}
					return null;
				}}
			/>
		</Panel>
	);
}

function Panel({
	title,
	icon,
	children,
}: {
	title: string;
	icon: ReactNode;
	children: ReactNode;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<span className="text-muted-foreground [&_svg]:size-5">{icon}</span>
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}

function ProductForm({
	form,
	setForm,
	onSubmit,
	pending,
}: {
	form: ProductRequest;
	setForm: (form: ProductRequest) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	pending: boolean;
}) {
	return (
		<form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-4">
			<Field
				label="Name"
				value={form.name}
				onChange={(value) => setForm({ ...form, name: value })}
			/>
			<Field
				label="SKU"
				value={form.sku}
				onChange={(value) => setForm({ ...form, sku: value })}
			/>
			<NumberField
				label="Price"
				value={form.price}
				onChange={(value) => setForm({ ...form, price: value })}
			/>
			<Field
				label="Currency"
				value={form.currency}
				onChange={(value) => setForm({ ...form, currency: value })}
			/>
			<NumberField
				label="Available"
				value={form.availableQuantity}
				onChange={(value) => setForm({ ...form, availableQuantity: value })}
			/>
			<NumberField
				label="Reorder level"
				value={form.reorderLevel}
				onChange={(value) => setForm({ ...form, reorderLevel: value })}
			/>
			<label className="flex items-end gap-2 pb-2 text-sm">
				<input
					type="checkbox"
					checked={form.active}
					onChange={(event) =>
						setForm({ ...form, active: event.target.checked })
					}
				/>
				Active
			</label>
			<div className="flex items-end">
				<Button type="submit" disabled={pending} className="w-full">
					{pending ? "Saving..." : "Save product"}
				</Button>
			</div>
		</form>
	);
}

function ProductAdminTable({
	products,
	onEdit,
	onDeactivate,
}: {
	products: Product[];
	onEdit: (product: Product) => void;
	onDeactivate: (id: string) => void;
}) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Product</TableHead>
					<TableHead>Price</TableHead>
					<TableHead>Stock</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Action</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{products.map((product) => (
					<TableRow key={product.id}>
						<TableCell>
							<p className="font-medium">{product.name}</p>
							<p className="text-xs text-muted-foreground">{product.sku}</p>
						</TableCell>
						<TableCell>
							{formatCurrency(product.price, product.currency)}
						</TableCell>
						<TableCell>{product.availableQuantity}</TableCell>
						<TableCell>
							<Badge variant={product.active ? "secondary" : "outline"}>
								{product.active ? "Active" : "Inactive"}
							</Badge>
						</TableCell>
						<TableCell>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => onEdit(product)}
								>
									Edit
								</Button>
								<Button
									type="button"
									variant="destructive"
									size="sm"
									onClick={() => onDeactivate(product.id)}
								>
									Deactivate
								</Button>
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

type OrderRow = {
	id: string;
	customerName: string;
	status: OrderStatus;
	itemCount: number;
	totalAmount: number;
	currency: string;
	createdAt: string;
};

function OrderTable({
	orders,
	action,
}: {
	orders: OrderRow[];
	action: (order: Pick<OrderRow, "id" | "status">) => ReactNode;
}) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Order</TableHead>
					<TableHead>Customer</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Items</TableHead>
					<TableHead>Total</TableHead>
					<TableHead>Created</TableHead>
					<TableHead>Action</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{orders.map((order) => (
					<TableRow key={order.id}>
						<TableCell className="font-mono text-xs">
							{order.id.slice(0, 8)}
						</TableCell>
						<TableCell>{order.customerName}</TableCell>
						<TableCell>
							<OrderStatusBadge status={order.status} />
						</TableCell>
						<TableCell>{order.itemCount}</TableCell>
						<TableCell>
							{formatCurrency(order.totalAmount, order.currency)}
						</TableCell>
						<TableCell>{formatDate(order.createdAt)}</TableCell>
						<TableCell>{action(order)}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function RideRequestForm({
	form,
	setForm,
	orders,
	onSubmit,
	pending,
}: {
	form: RideFormState;
	setForm: (form: RideFormState) => void;
	orders: OrderRow[];
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	pending: boolean;
}) {
	return (
		<form onSubmit={onSubmit} className="mb-4 grid gap-4 md:grid-cols-5">
			<div className="space-y-2">
				<Label htmlFor="ride-order">Order</Label>
				<select
					id="ride-order"
					value={form.orderId}
					onChange={(event) =>
						setForm({ ...form, orderId: event.target.value })
					}
					className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
					required
				>
					<option value="">Select order</option>
					{orders.map((order) => (
						<option key={order.id} value={order.id}>
							{order.id.slice(0, 8)} - {order.status}
						</option>
					))}
				</select>
			</div>
			<Field
				label="Pickup"
				value={form.pickupLocation}
				onChange={(value) => setForm({ ...form, pickupLocation: value })}
			/>
			<Field
				label="Dropoff"
				value={form.dropoffLocation}
				onChange={(value) => setForm({ ...form, dropoffLocation: value })}
			/>
			<Field
				label="Distance KM"
				type="number"
				value={form.distanceKm}
				onChange={(value) => setForm({ ...form, distanceKm: value })}
			/>
			<div className="flex items-end">
				<Button type="submit" disabled={pending} className="w-full">
					{pending ? "Requesting..." : "Request ride"}
				</Button>
			</div>
		</form>
	);
}

function RideTable({
	rides,
	action,
}: {
	rides: Ride[];
	action: (ride: Ride) => ReactNode;
}) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Ride</TableHead>
					<TableHead>Route</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Driver</TableHead>
					<TableHead>Fare</TableHead>
					<TableHead>Requested</TableHead>
					<TableHead>Action</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{rides.map((ride) => (
					<TableRow key={ride.id}>
						<TableCell className="font-mono text-xs">
							{ride.id.slice(0, 8)}
						</TableCell>
						<TableCell>
							{ride.pickupLocation} to {ride.dropoffLocation}
						</TableCell>
						<TableCell>
							<RideStatusBadge status={ride.status} />
						</TableCell>
						<TableCell>{ride.driverName ?? "-"}</TableCell>
						<TableCell>
							{ride.fareAmount
								? formatCurrency(ride.fareAmount, ride.currency)
								: "-"}
						</TableCell>
						<TableCell>{formatDate(ride.requestedAt)}</TableCell>
						<TableCell>{action(ride)}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function StatusSelect<T extends string>({
	value,
	options,
	onChange,
}: {
	value: T;
	options: T[];
	onChange: (value: T) => void;
}) {
	return (
		<select
			value={value}
			onChange={(event) => onChange(event.target.value as T)}
			className="h-8 rounded-md border border-input bg-background px-2 text-xs"
		>
			{options.map((option) => (
				<option key={option} value={option}>
					{option}
				</option>
			))}
		</select>
	);
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
	return (
		<Badge variant={status === "CANCELLED" ? "outline" : "secondary"}>
			{status}
		</Badge>
	);
}

function RideStatusBadge({ status }: { status: RideStatus }) {
	return (
		<Badge variant={status === "CANCELLED" ? "outline" : "secondary"}>
			{status}
		</Badge>
	);
}

function Field({
	label,
	value,
	onChange,
	type = "text",
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	type?: string;
}) {
	const id = label.toLowerCase().replace(/\s+/g, "-");

	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<Input
				id={id}
				type={type}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				required
			/>
		</div>
	);
}

function NumberField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: number;
	onChange: (value: number) => void;
}) {
	return (
		<Field
			label={label}
			type="number"
			value={String(value)}
			onChange={(value) => onChange(Number(value))}
		/>
	);
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Request failed";
}
