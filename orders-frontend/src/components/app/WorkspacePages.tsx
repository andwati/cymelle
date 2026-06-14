import { Link } from "@tanstack/react-router";
import {
	Boxes,
	Car,
	ClipboardList,
	PackagePlus,
	Search,
	Users,
} from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from "recharts";
import { toast } from "sonner";
import { AppShell } from "#/components/app/AppShell";
import { ProductGrid } from "#/components/store/ProductGrid";
import { StoreHome } from "#/components/store/StoreHome";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "#/components/ui/chart";
import { ErrorState } from "#/components/ui/ErrorState";
import { Input } from "#/components/ui/input";
import { LoadingState } from "#/components/ui/LoadingState";
import { Label } from "#/components/ui/label";
import { StatusBadge, statusColorClass } from "#/components/ui/status-badge";
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
import { useInventory, useLowStockInventory } from "#/hooks/useInventory";
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
import {
	useCreateUser,
	useDisableUser,
	useUpdateUser,
	useUsers,
} from "#/hooks/useUsers";
import type { Role } from "#/types/auth";
import type { InventoryItem } from "#/types/inventory";
import type { OrderStatus, OrderSummary } from "#/types/order";
import type { Product, ProductRequest } from "#/types/product";
import type { Ride, RideStatus } from "#/types/ride";
import type { AdminUserRequest, UserSummary } from "#/types/user";

const emptyProductForm: ProductRequest = {
	name: "",
	sku: "",
	price: 0,
	currency: "KES",
	active: true,
	availableQuantity: 0,
	reorderLevel: 5,
};

const emptyUserForm: AdminUserRequest = {
	username: "",
	displayName: "",
	password: "",
	role: "CUSTOMER",
	enabled: true,
};

export function ProductListingPage({
	featured = false,
}: {
	featured?: boolean;
}) {
	const { user } = useAuth();

	if (!user) {
		return <StoreHome />;
	}

	return (
		<AppShell title={featured ? "Featured products" : "Products"} showCart>
			<ProductsContent featured={featured} />
		</AppShell>
	);
}

function ProductsContent({ featured }: { featured: boolean }) {
	const productsQuery = useProducts();
	const cart = useCart();
	const [searchQuery, setSearchQuery] = useState("");
	const products = useMemo(() => {
		const items = productsQuery.data ?? [];
		const visible = featured
			? items
					.filter((product) => product.active && product.availableQuantity > 0)
					.sort((a, b) => b.availableQuantity - a.availableQuantity)
					.slice(0, 6)
			: items;
		return visible.filter((product) =>
			matchesText(searchQuery, product.name, product.sku, product.currency),
		);
	}, [featured, productsQuery.data, searchQuery]);

	if (productsQuery.isError) {
		return (
			<ErrorState
				message={errorMessage(productsQuery.error)}
				onRetry={() => productsQuery.refetch()}
			/>
		);
	}

	return (
		<PageStack
			eyebrow="Store"
			title={featured ? "Featured inventory" : "Product listing"}
			description="Browse active products, choose quantities, and add items to your cart."
		>
			<SearchField
				value={searchQuery}
				onChange={setSearchQuery}
				placeholder="Search products by name, SKU, or currency"
			/>
			<ProductGrid
				products={products}
				isLoading={productsQuery.isLoading}
				onAddToCart={cart.addItem}
			/>
		</PageStack>
	);
}

export function AdminOverviewPage() {
	return (
		<AppShell title="Admin overview" allowedRoles={["ADMIN"]}>
			<AdminOverviewContent />
		</AppShell>
	);
}

function AdminOverviewContent() {
	const productsQuery = useProducts();
	const inventoryQuery = useInventory();
	const ordersQuery = useOrders({ status: "", from: "", to: "" }, 0, 100);
	const ridesQuery = useRides();

	const products = productsQuery.data ?? [];
	const inventory = inventoryQuery.data?.items ?? [];
	const orders = ordersQuery.data?.items ?? [];
	const rides = ridesQuery.data ?? [];
	const revenueTrend = useMemo(() => dailyOrderRevenue(orders), [orders]);
	const orderStatusData = useMemo(
		() =>
			statusCounts(orders, ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"]),
		[orders],
	);
	const rideStatusData = useMemo(
		() =>
			statusCounts(rides, ["REQUESTED", "ACCEPTED", "COMPLETED", "CANCELLED"]),
		[rides],
	);
	const inventoryDepth = useMemo(
		() =>
			inventory.slice(0, 8).map((item) => ({
				name: compactLabel(item.productName),
				available: item.availableQuantity,
				reorder: item.reorderLevel,
			})),
		[inventory],
	);
	const revenue = orders
		.filter((order) => order.status !== "CANCELLED")
		.reduce((total, order) => total + order.totalAmount, 0);

	return (
		<PageStack
			eyebrow="Operations"
			title="Overview"
			description="Current store, fulfillment, and ride activity."
		>
			<div className="grid gap-4 md:grid-cols-4">
				<MetricCard
					title="Products"
					value={String(products.length)}
					detail="Catalog items"
				/>
				<MetricCard
					title="Low stock"
					value={String(
						inventory.filter((item) => item.status !== "IN_STOCK").length,
					)}
					detail="Inventory alerts"
				/>
				<MetricCard
					title="Pending orders"
					value={String(
						orders.filter((order) => order.status === "PENDING").length,
					)}
					detail="Awaiting fulfillment"
				/>
				<MetricCard
					title="Revenue"
					value={formatCurrency(revenue, "KES")}
					detail="Non-cancelled orders"
				/>
			</div>
			<div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
				<Panel title="Revenue trend" icon={<ClipboardList />}>
					<RevenueAreaChart data={revenueTrend} />
				</Panel>
				<Panel title="Order mix" icon={<ClipboardList />}>
					<StatusPieChart data={orderStatusData} />
				</Panel>
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				<Panel title="Ride pipeline" icon={<Car />}>
					<StatusBarChart data={rideStatusData} />
				</Panel>
				<Panel title="Inventory depth" icon={<Boxes />}>
					<InventoryBarChart data={inventoryDepth} />
				</Panel>
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				<Panel title="Pending orders" icon={<ClipboardList />}>
					<OrderTable
						orders={orders.filter((order) => order.status === "PENDING")}
					/>
				</Panel>
				<Panel title="Ride requests" icon={<Car />}>
					<RideTable
						rides={rides.filter((ride) => ride.status === "REQUESTED")}
					/>
				</Panel>
			</div>
		</PageStack>
	);
}

export function CustomerOverviewPage() {
	return (
		<AppShell title="Customer overview" allowedRoles={["CUSTOMER"]} showCart>
			<CustomerOverviewContent />
		</AppShell>
	);
}

function CustomerOverviewContent() {
	const productsQuery = useProducts();
	const ordersQuery = useOrders({ status: "", from: "", to: "" }, 0, 100);
	const ridesQuery = useRides();
	const cart = useCart();
	const products = productsQuery.data ?? [];
	const orders = ordersQuery.data?.items ?? [];
	const rides = ridesQuery.data ?? [];
	const spendTrend = useMemo(() => dailyOrderRevenue(orders), [orders]);
	const orderStatusData = useMemo(
		() =>
			statusCounts(orders, ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"]),
		[orders],
	);
	const rideStatusData = useMemo(
		() =>
			statusCounts(rides, ["REQUESTED", "ACCEPTED", "COMPLETED", "CANCELLED"]),
		[rides],
	);
	const spend = orders
		.filter((order) => order.status !== "CANCELLED")
		.reduce((total, order) => total + order.totalAmount, 0);

	return (
		<PageStack
			eyebrow="Customer"
			title="Dashboard"
			description="Your cart, orders, delivery rides, and recent buying activity."
		>
			<div className="grid gap-4 md:grid-cols-4">
				<MetricCard
					title="Cart items"
					value={String(cart.itemCount)}
					detail={formatCurrency(cart.totalAmount, cart.currency)}
				/>
				<MetricCard
					title="Total spend"
					value={formatCurrency(spend, "KES")}
					detail="Completed and active orders"
				/>
				<MetricCard
					title="Active orders"
					value={String(
						orders.filter(
							(order) =>
								order.status === "PENDING" || order.status === "SHIPPED",
						).length,
					)}
					detail="Awaiting delivery"
				/>
				<MetricCard
					title="Available products"
					value={String(
						products.filter(
							(product) => product.active && product.availableQuantity > 0,
						).length,
					)}
					detail="Ready to add to cart"
				/>
			</div>
			<div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
				<Panel title="Spend trend" icon={<ClipboardList />}>
					<RevenueAreaChart data={spendTrend} />
				</Panel>
				<Panel title="Order status" icon={<ClipboardList />}>
					<StatusPieChart data={orderStatusData} />
				</Panel>
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				<Panel title="Ride status" icon={<Car />}>
					<StatusBarChart data={rideStatusData} />
				</Panel>
				<Panel title="Recent orders" icon={<ClipboardList />}>
					<OrderTable
						orders={orders.slice(0, 6)}
						loading={ordersQuery.isLoading}
					/>
				</Panel>
			</div>
		</PageStack>
	);
}

export function DriverOverviewPage() {
	return (
		<AppShell title="Driver overview" allowedRoles={["DRIVER"]}>
			<DriverOverviewContent />
		</AppShell>
	);
}

function DriverOverviewContent() {
	const ridesQuery = useRides();
	const rides = ridesQuery.data ?? [];
	const statusData = useMemo(
		() =>
			statusCounts(rides, ["REQUESTED", "ACCEPTED", "COMPLETED", "CANCELLED"]),
		[rides],
	);
	const completedTrend = useMemo(() => dailyRideCounts(rides), [rides]);
	const fareTrend = useMemo(() => dailyRideFares(rides), [rides]);
	const assignedRides = rides.filter(
		(ride) => ride.driverId && ride.status !== "CANCELLED",
	);
	const totalFare = assignedRides.reduce(
		(total, ride) => total + (ride.fareAmount ?? 0),
		0,
	);

	return (
		<PageStack
			eyebrow="Driver"
			title="Dashboard"
			description="Available requests, active routes, completed rides, and fare activity."
		>
			<div className="grid gap-4 md:grid-cols-4">
				<MetricCard
					title="Available"
					value={String(
						rides.filter((ride) => ride.status === "REQUESTED").length,
					)}
					detail="Open ride requests"
				/>
				<MetricCard
					title="Active"
					value={String(
						rides.filter((ride) => ride.status === "ACCEPTED").length,
					)}
					detail="Assigned routes"
				/>
				<MetricCard
					title="Completed"
					value={String(
						rides.filter((ride) => ride.status === "COMPLETED").length,
					)}
					detail="Finished deliveries"
				/>
				<MetricCard
					title="Fare volume"
					value={formatCurrency(totalFare, "KES")}
					detail="Assigned rides"
				/>
			</div>
			<div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
				<Panel title="Completed rides" icon={<Car />}>
					<RideActivityChart data={completedTrend} />
				</Panel>
				<Panel title="Ride status" icon={<Car />}>
					<StatusBarChart data={statusData} />
				</Panel>
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				<Panel title="Fare trend" icon={<Car />}>
					<FareAreaChart data={fareTrend} />
				</Panel>
				<Panel title="Active routes" icon={<Car />}>
					<RideTable
						rides={rides
							.filter(
								(ride) =>
									ride.status === "REQUESTED" || ride.status === "ACCEPTED",
							)
							.slice(0, 8)}
						loading={ridesQuery.isLoading}
					/>
				</Panel>
			</div>
		</PageStack>
	);
}

export function AdminInventoryPage() {
	return (
		<AppShell title="Inventory" allowedRoles={["ADMIN"]}>
			<AdminInventoryContent />
		</AppShell>
	);
}

function AdminInventoryContent() {
	const inventoryQuery = useInventory();
	const lowStockQuery = useLowStockInventory();
	const [searchQuery, setSearchQuery] = useState("");
	const inventory = inventoryQuery.data?.items ?? [];
	const filteredInventory = useMemo(
		() =>
			inventory.filter((item) =>
				matchesText(searchQuery, item.productName, item.sku, item.status),
			),
		[inventory, searchQuery],
	);

	return (
		<PageStack
			eyebrow="Admin"
			title="Inventory health"
			description="Track available stock and reorder pressure."
		>
			<div className="grid gap-4 md:grid-cols-3">
				<MetricCard
					title="Items"
					value={String(inventory.length)}
					detail="Tracked SKUs"
				/>
				<MetricCard
					title="Low stock"
					value={String(lowStockQuery.data?.items.length ?? 0)}
					detail="Need attention"
				/>
				<MetricCard
					title="Out of stock"
					value={String(
						inventory.filter((item) => item.status === "OUT_OF_STOCK").length,
					)}
					detail="Cannot be sold"
				/>
			</div>
			<Panel title="Inventory" icon={<Boxes />}>
				<div className="space-y-4">
					<SearchField
						value={searchQuery}
						onChange={setSearchQuery}
						placeholder="Search inventory by product, SKU, or status"
					/>
					<InventoryTable
						items={filteredInventory}
						loading={inventoryQuery.isLoading}
					/>
				</div>
			</Panel>
		</PageStack>
	);
}

export function AdminProductsPage() {
	return (
		<AppShell title="Products" allowedRoles={["ADMIN"]}>
			<AdminProductsContent />
		</AppShell>
	);
}

function AdminProductsContent() {
	const productsQuery = useProducts();
	const createProduct = useCreateProduct();
	const updateProduct = useUpdateProduct();
	const deactivateProduct = useDeactivateProduct();
	const [editing, setEditing] = useState<Product | null>(null);
	const [form, setForm] = useState<ProductRequest>(emptyProductForm);
	const [searchQuery, setSearchQuery] = useState("");
	const products = productsQuery.data ?? [];
	const filteredProducts = useMemo(
		() =>
			products.filter((product) =>
				matchesText(
					searchQuery,
					product.name,
					product.sku,
					product.currency,
					product.active ? "active" : "inactive",
				),
			),
		[products, searchQuery],
	);

	async function submitProduct(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		try {
			if (editing) {
				await updateProduct.mutateAsync({ id: editing.id, request: form });
				toast.success("Product updated");
			} else {
				await createProduct.mutateAsync(form);
				toast.success("Product created");
			}
			setEditing(null);
			setForm(emptyProductForm);
		} catch (error) {
			toastError(
				error,
				editing ? "Could not update product" : "Could not create product",
			);
		}
	}

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

	return (
		<PageStack
			eyebrow="Admin"
			title="Product catalog"
			description="Create products, update pricing, and manage availability."
		>
			<Panel
				title={editing ? "Edit product" : "Add product"}
				icon={<PackagePlus />}
			>
				<ProductForm
					form={form}
					setForm={setForm}
					onSubmit={submitProduct}
					pending={createProduct.isPending || updateProduct.isPending}
					submitLabel={editing ? "Update product" : "Create product"}
				/>
			</Panel>
			<Panel title="Products" icon={<Boxes />}>
				<div className="space-y-4">
					<SearchField
						value={searchQuery}
						onChange={setSearchQuery}
						placeholder="Search products by name, SKU, currency, or status"
					/>
					<ProductAdminTable
						products={filteredProducts}
						loading={productsQuery.isLoading}
						onEdit={startEdit}
						onDeactivate={(id) =>
							deactivateProduct.mutate(id, {
								onSuccess: () => toast.warning("Product deactivated"),
								onError: (error) =>
									toastError(error, "Could not deactivate product"),
							})
						}
					/>
				</div>
			</Panel>
		</PageStack>
	);
}

export function AdminProductCreatePage() {
	return (
		<AppShell title="Create product" allowedRoles={["ADMIN"]}>
			<AdminProductCreateContent />
		</AppShell>
	);
}

function AdminProductCreateContent() {
	const createProduct = useCreateProduct();
	const [form, setForm] = useState<ProductRequest>(emptyProductForm);

	async function submitProduct(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		try {
			await createProduct.mutateAsync(form);
			setForm(emptyProductForm);
			toast.success("Product created");
		} catch (error) {
			toastError(error, "Could not create product");
		}
	}

	return (
		<PageStack
			eyebrow="Admin"
			title="Create product"
			description="Add a new sellable product and starting stock."
		>
			<Panel title="New product" icon={<PackagePlus />}>
				<ProductForm
					form={form}
					setForm={setForm}
					onSubmit={submitProduct}
					pending={createProduct.isPending}
					submitLabel="Create product"
				/>
			</Panel>
		</PageStack>
	);
}

export function AdminOrdersPage({ status }: { status?: OrderStatus }) {
	return (
		<AppShell
			title={status === "PENDING" ? "Pending orders" : "Orders"}
			allowedRoles={["ADMIN"]}
		>
			<OrdersContent admin status={status} />
		</AppShell>
	);
}

export function CustomerOrdersPage({ status }: { status?: OrderStatus }) {
	return (
		<AppShell
			title={status ? "Delivery status" : "My orders"}
			allowedRoles={["CUSTOMER"]}
			showCart
		>
			<OrdersContent status={status} />
		</AppShell>
	);
}

function OrdersContent({
	admin = false,
	status,
}: {
	admin?: boolean;
	status?: OrderStatus;
}) {
	const ordersQuery = useOrders({ status: status ?? "", from: "", to: "" });
	const updateOrderStatus = useUpdateOrderStatus();
	const [searchQuery, setSearchQuery] = useState("");
	const orders = ordersQuery.data?.items ?? [];
	const filteredOrders = useMemo(
		() =>
			orders.filter((order) =>
				matchesText(
					searchQuery,
					order.id,
					order.customerName,
					order.status,
					order.currency,
				),
			),
		[orders, searchQuery],
	);

	return (
		<PageStack
			eyebrow={admin ? "Admin" : "Customer"}
			title={
				status === "PENDING"
					? "Pending orders"
					: status
						? `${status.toLowerCase()} orders`
						: admin
							? "All orders"
							: "Order history"
			}
			description={
				admin
					? "Review and update fulfillment status."
					: "Track your purchase history and delivery progress."
			}
		>
			<Panel title="Orders" icon={<ClipboardList />}>
				<div className="space-y-4">
					<SearchField
						value={searchQuery}
						onChange={setSearchQuery}
						placeholder="Search orders by ID, customer, status, or currency"
					/>
					<OrderTable
						orders={filteredOrders}
						loading={ordersQuery.isLoading}
						action={
							admin
								? (order) => (
										<StatusSelect<OrderStatus>
											value={order.status}
											options={["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"]}
											onChange={(nextStatus) =>
												updateOrderStatus.mutate(
													{ id: order.id, status: nextStatus },
													{
														onSuccess: () => orderStatusToast(nextStatus),
														onError: (error) =>
															toastError(error, "Could not update order"),
													},
												)
											}
										/>
									)
								: undefined
						}
					/>
				</div>
			</Panel>
		</PageStack>
	);
}

export function AdminRidesPage({ status }: { status?: RideStatus }) {
	return (
		<AppShell
			title={
				status === "REQUESTED"
					? "Ride requests"
					: status === "ACCEPTED"
						? "Driver assignments"
						: "Rides"
			}
			allowedRoles={["ADMIN"]}
		>
			<RidesContent admin status={status} />
		</AppShell>
	);
}

export function CustomerRidesPage() {
	return (
		<AppShell title="My rides" allowedRoles={["CUSTOMER"]} showCart>
			<RidesContent />
		</AppShell>
	);
}

export function CustomerRideRequestPage() {
	return (
		<AppShell title="Request ride" allowedRoles={["CUSTOMER"]} showCart>
			<RideRequestContent />
		</AppShell>
	);
}

export function DriverRidesPage({ status }: { status?: RideStatus }) {
	return (
		<AppShell
			title={
				status === "REQUESTED"
					? "Available rides"
					: status === "ACCEPTED"
						? "Active route"
						: status === "COMPLETED"
							? "Completed rides"
							: "Driver rides"
			}
			allowedRoles={["DRIVER"]}
		>
			<RidesContent driver status={status} />
		</AppShell>
	);
}

function RideRequestContent() {
	const requestRide = useRequestRide();
	const ordersQuery = useOrders({ status: "", from: "", to: "" });
	const [form, setForm] = useState({
		orderId: "",
		pickupLocation: "",
		dropoffLocation: "",
		distanceKm: "5",
	});

	async function submitRide(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!form.orderId) {
			toast.error("Select an order first");
			return;
		}
		try {
			await requestRide.mutateAsync({
				orderId: form.orderId,
				pickupLocation: form.pickupLocation,
				dropoffLocation: form.dropoffLocation,
				distanceKm: Number(form.distanceKm),
			});
			setForm({
				orderId: "",
				pickupLocation: "",
				dropoffLocation: "",
				distanceKm: "5",
			});
			toast.success("Ride requested", {
				description: "Drivers can now accept this delivery.",
			});
		} catch (error) {
			toastError(error, "Could not request ride");
		}
	}

	return (
		<PageStack
			eyebrow="Customer"
			title="Request a ride"
			description="Create a delivery ride for an order you placed."
		>
			<Panel title="Ride details" icon={<Car />}>
				<RideRequestForm
					form={form}
					setForm={setForm}
					orders={ordersQuery.data?.items ?? []}
					onSubmit={submitRide}
					pending={requestRide.isPending}
				/>
			</Panel>
		</PageStack>
	);
}

function RidesContent({
	admin = false,
	driver = false,
	status,
}: {
	admin?: boolean;
	driver?: boolean;
	status?: RideStatus;
}) {
	const ridesQuery = useRides();
	const updateRideStatus = useUpdateRideStatus();
	const acceptRide = useAcceptRide();
	const completeRide = useCompleteRide();
	const cancelRide = useCancelRide();
	const [searchQuery, setSearchQuery] = useState("");
	const rides = (ridesQuery.data ?? []).filter(
		(ride) => !status || ride.status === status,
	);
	const filteredRides = useMemo(
		() =>
			rides.filter((ride) =>
				matchesText(
					searchQuery,
					ride.id,
					ride.orderId ?? "",
					ride.customerName,
					ride.driverName ?? "",
					ride.pickupLocation,
					ride.dropoffLocation,
					ride.status,
				),
			),
		[rides, searchQuery],
	);

	return (
		<PageStack
			eyebrow={admin ? "Admin" : driver ? "Driver" : "Customer"}
			title={
				status
					? `${status.toLowerCase()} rides`
					: driver
						? "Ride board"
						: "Ride history"
			}
			description={
				admin
					? "Monitor ride lifecycle and intervene when needed."
					: driver
						? "Accept requested rides and complete assigned trips."
						: "Review your ride requests and current status."
			}
		>
			<Panel title="Rides" icon={<Car />}>
				<div className="space-y-4">
					<SearchField
						value={searchQuery}
						onChange={setSearchQuery}
						placeholder="Search rides by ID, order, route, person, or status"
					/>
					<RideTable
						rides={filteredRides}
						loading={ridesQuery.isLoading}
						action={(ride) => {
							if (admin) {
								return (
									<StatusSelect<RideStatus>
										value={ride.status}
										options={[
											"REQUESTED",
											"ACCEPTED",
											"COMPLETED",
											"CANCELLED",
										]}
										onChange={(nextStatus) =>
											updateRideStatus.mutate(
												{ id: ride.id, status: nextStatus },
												{
													onSuccess: () => rideStatusToast(nextStatus),
													onError: (error) =>
														toastError(error, "Could not update ride"),
												},
											)
										}
									/>
								);
							}
							if (driver && ride.status === "REQUESTED") {
								return (
									<Button
										type="button"
										size="sm"
										onClick={() =>
											acceptRide.mutate(ride.id, {
												onSuccess: () =>
													toast.info("Ride accepted", {
														description: "It is now assigned to you.",
													}),
												onError: (error) =>
													toastError(error, "Could not accept ride"),
											})
										}
									>
										Accept
									</Button>
								);
							}
							if (driver && ride.status === "ACCEPTED") {
								return (
									<Button
										type="button"
										size="sm"
										onClick={() =>
											completeRide.mutate(ride.id, {
												onSuccess: () =>
													toast.success("Ride completed", {
														description:
															"The attached order was marked delivered.",
													}),
												onError: (error) =>
													toastError(error, "Could not complete ride"),
											})
										}
									>
										Complete
									</Button>
								);
							}
							if (!driver && !admin && ride.status === "REQUESTED") {
								return (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											cancelRide.mutate(ride.id, {
												onSuccess: () => toast.warning("Ride cancelled"),
												onError: (error) =>
													toastError(error, "Could not cancel ride"),
											})
										}
									>
										Cancel
									</Button>
								);
							}
							return null;
						}}
					/>
				</div>
			</Panel>
		</PageStack>
	);
}

export function AdminCustomersPage() {
	return (
		<AppShell title="Customers" allowedRoles={["ADMIN"]}>
			<AdminUsersContent roleFilter="CUSTOMER" title="Customers" />
		</AppShell>
	);
}

export function AdminDriversPage() {
	return (
		<AppShell title="Drivers" allowedRoles={["ADMIN"]}>
			<AdminUsersContent roleFilter="DRIVER" title="Drivers" />
		</AppShell>
	);
}

export function AdminUsersPage() {
	return (
		<AppShell title="Users" allowedRoles={["ADMIN"]}>
			<AdminUsersContent title="Users" />
		</AppShell>
	);
}

function AdminUsersContent({
	roleFilter,
	title,
}: {
	roleFilter?: Role;
	title: string;
}) {
	const usersQuery = useUsers();
	const createUser = useCreateUser();
	const updateUser = useUpdateUser();
	const disableUser = useDisableUser();
	const [editing, setEditing] = useState<UserSummary | null>(null);
	const [form, setForm] = useState<AdminUserRequest>({
		...emptyUserForm,
		role: roleFilter ?? "CUSTOMER",
	});
	const [searchQuery, setSearchQuery] = useState("");
	const users = (usersQuery.data ?? []).filter(
		(user) => !roleFilter || user.role === roleFilter,
	);
	const filteredUsers = useMemo(
		() =>
			users.filter((user) =>
				matchesText(
					searchQuery,
					user.displayName,
					user.username,
					user.role,
					user.enabled ? "enabled" : "disabled",
				),
			),
		[users, searchQuery],
	);

	function startEdit(user: UserSummary) {
		setEditing(user);
		setForm({
			username: user.username,
			displayName: user.displayName,
			password: "",
			role: user.role,
			enabled: user.enabled,
		});
	}

	async function submitUser(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const request = { ...form, role: roleFilter ?? form.role };
		try {
			if (editing) {
				await updateUser.mutateAsync({ id: editing.id, request });
				toast.success("User updated");
			} else {
				await createUser.mutateAsync(request);
				toast.success("User created");
			}
			setEditing(null);
			setForm({ ...emptyUserForm, role: roleFilter ?? "CUSTOMER" });
		} catch (error) {
			toastError(
				error,
				editing ? "Could not update user" : "Could not create user",
			);
		}
	}

	return (
		<PageStack
			eyebrow="Admin"
			title={title}
			description="Create, update, and disable platform accounts."
		>
			<Panel title={editing ? "Edit user" : "Create user"} icon={<Users />}>
				<UserForm
					form={form}
					setForm={setForm}
					roleLocked={roleFilter}
					pending={createUser.isPending || updateUser.isPending}
					onSubmit={submitUser}
					submitLabel={editing ? "Update user" : "Create user"}
				/>
			</Panel>
			<Panel title={`${title} list`} icon={<Users />}>
				<div className="space-y-4">
					<SearchField
						value={searchQuery}
						onChange={setSearchQuery}
						placeholder="Search users by name, username, role, or status"
					/>
					<UserTable
						users={filteredUsers}
						loading={usersQuery.isLoading}
						onEdit={startEdit}
						onDisable={(id) =>
							disableUser.mutate(id, {
								onSuccess: () => toast.warning("User disabled"),
								onError: (error) => toastError(error, "Could not disable user"),
							})
						}
					/>
				</div>
			</Panel>
		</PageStack>
	);
}

function PageStack({
	eyebrow,
	title,
	description,
	children,
}: {
	eyebrow: string;
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<div className="space-y-5">
			<div>
				<p className="text-sm font-medium uppercase text-muted-foreground">
					{eyebrow}
				</p>
				<h1 className="mt-2 text-3xl font-semibold tracking-normal">{title}</h1>
				<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
					{description}
				</p>
			</div>
			{children}
		</div>
	);
}

function MetricCard({
	title,
	value,
	detail,
}: {
	title: string;
	value: string;
	detail: string;
}) {
	return (
		<Card>
			<CardContent className="p-5">
				<p className="text-sm text-muted-foreground">{title}</p>
				<p className="mt-2 text-3xl font-semibold">{value}</p>
				<p className="mt-1 text-sm text-muted-foreground">{detail}</p>
			</CardContent>
		</Card>
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

function SearchField({
	value,
	onChange,
	placeholder,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
}) {
	return (
		<div className="relative max-w-xl">
			<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className="pl-9"
				aria-label={placeholder}
			/>
		</div>
	);
}

function RevenueAreaChart({
	data,
}: {
	data: { label: string; revenue: number }[];
}) {
	return (
		<ChartContainer
			config={{ revenue: { label: "Revenue", color: "var(--chart-1)" } }}
			className="h-[260px] w-full"
		>
			<AreaChart data={data} margin={{ left: 8, right: 8 }}>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(value) => formatShortNumber(value)}
				/>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent indicator="line" />}
				/>
				<Area
					dataKey="revenue"
					type="monotone"
					fill="var(--color-revenue)"
					fillOpacity={0.22}
					stroke="var(--color-revenue)"
					strokeWidth={2}
				/>
			</AreaChart>
		</ChartContainer>
	);
}

function FareAreaChart({ data }: { data: { label: string; fare: number }[] }) {
	return (
		<ChartContainer
			config={{ fare: { label: "Fare", color: "var(--chart-2)" } }}
			className="h-[260px] w-full"
		>
			<AreaChart data={data} margin={{ left: 8, right: 8 }}>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(value) => formatShortNumber(value)}
				/>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent indicator="line" />}
				/>
				<Area
					dataKey="fare"
					type="monotone"
					fill="var(--color-fare)"
					fillOpacity={0.2}
					stroke="var(--color-fare)"
					strokeWidth={2}
				/>
			</AreaChart>
		</ChartContainer>
	);
}

function RideActivityChart({
	data,
}: {
	data: { label: string; completed: number }[];
}) {
	return (
		<ChartContainer
			config={{ completed: { label: "Completed", color: "var(--chart-3)" } }}
			className="h-[260px] w-full"
		>
			<BarChart data={data}>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<YAxis
					allowDecimals={false}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
				<Bar
					dataKey="completed"
					fill="var(--color-completed)"
					radius={[6, 6, 0, 0]}
				/>
			</BarChart>
		</ChartContainer>
	);
}

function StatusBarChart({
	data,
}: {
	data: { status: string; count: number }[];
}) {
	return (
		<ChartContainer
			config={{ count: { label: "Count", color: "var(--chart-2)" } }}
			className="h-[260px] w-full"
		>
			<BarChart data={data} layout="vertical" margin={{ left: 16, right: 8 }}>
				<CartesianGrid horizontal={false} />
				<XAxis type="number" allowDecimals={false} hide />
				<YAxis
					dataKey="status"
					type="category"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					width={86}
				/>
				<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
				<Bar dataKey="count" radius={[0, 6, 6, 0]}>
					{data.map((item) => (
						<Cell key={item.status} fill={chartColorForStatus(item.status)} />
					))}
				</Bar>
			</BarChart>
		</ChartContainer>
	);
}

function StatusPieChart({
	data,
}: {
	data: { status: string; count: number }[];
}) {
	return (
		<ChartContainer
			config={{ count: { label: "Count", color: "var(--chart-1)" } }}
			className="h-[260px] w-full"
		>
			<PieChart>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent hideLabel />}
				/>
				<Pie
					data={data}
					dataKey="count"
					nameKey="status"
					innerRadius={52}
					outerRadius={88}
					paddingAngle={2}
				>
					{data.map((item) => (
						<Cell key={item.status} fill={chartColorForStatus(item.status)} />
					))}
				</Pie>
			</PieChart>
		</ChartContainer>
	);
}

function InventoryBarChart({
	data,
}: {
	data: { name: string; available: number; reorder: number }[];
}) {
	return (
		<ChartContainer
			config={{
				available: { label: "Available", color: "var(--chart-2)" },
				reorder: { label: "Reorder", color: "var(--chart-5)" },
			}}
			className="h-[260px] w-full"
		>
			<BarChart data={data}>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="name"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<YAxis
					allowDecimals={false}
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
				<Bar
					dataKey="available"
					fill="var(--color-available)"
					radius={[6, 6, 0, 0]}
				/>
				<Bar
					dataKey="reorder"
					fill="var(--color-reorder)"
					radius={[6, 6, 0, 0]}
				/>
			</BarChart>
		</ChartContainer>
	);
}

function ProductForm({
	form,
	setForm,
	onSubmit,
	pending,
	submitLabel,
}: {
	form: ProductRequest;
	setForm: (form: ProductRequest) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	pending: boolean;
	submitLabel: string;
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
					{pending ? "Saving..." : submitLabel}
				</Button>
			</div>
		</form>
	);
}

function ProductAdminTable({
	products,
	loading,
	onEdit,
	onDeactivate,
}: {
	products: Product[];
	loading: boolean;
	onEdit: (product: Product) => void;
	onDeactivate: (id: string) => void;
}) {
	if (loading) {
		return <LoadingState title="Loading products" />;
	}

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
							<Button asChild variant="link" className="h-auto p-0 font-medium">
								<Link
									to="/products/$productId"
									params={{ productId: product.id }}
								>
									{product.name}
								</Link>
							</Button>
							<p className="text-xs text-muted-foreground">{product.sku}</p>
						</TableCell>
						<TableCell>
							{formatCurrency(product.price, product.currency)}
						</TableCell>
						<TableCell>{product.availableQuantity}</TableCell>
						<TableCell>
							<StatusBadge
								status={product.active ? "ACTIVE" : "INACTIVE"}
								label={product.active ? "Active" : "Inactive"}
							/>
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

function InventoryTable({
	items,
	loading,
}: {
	items: InventoryItem[];
	loading: boolean;
}) {
	if (loading) {
		return <LoadingState title="Loading inventory" />;
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Product</TableHead>
					<TableHead>Available</TableHead>
					<TableHead>Reserved</TableHead>
					<TableHead>Reorder</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Updated</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{items.map((item) => (
					<TableRow key={item.productId}>
						<TableCell>
							<p className="font-medium">{item.productName}</p>
							<p className="text-xs text-muted-foreground">{item.sku}</p>
						</TableCell>
						<TableCell>{item.availableQuantity}</TableCell>
						<TableCell>{item.reservedQuantity}</TableCell>
						<TableCell>{item.reorderLevel}</TableCell>
						<TableCell>
							<StatusBadge status={item.status} />
						</TableCell>
						<TableCell>{formatDate(item.updatedAt)}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function OrderTable({
	orders,
	loading = false,
	action,
}: {
	orders: OrderSummary[];
	loading?: boolean;
	action?: (order: OrderSummary) => ReactNode;
}) {
	if (loading) {
		return <LoadingState title="Loading orders" />;
	}

	if (orders.length === 0) {
		return <EmptyPanel message="No orders found." />;
	}

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
					{action ? <TableHead>Action</TableHead> : null}
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
							<StatusBadge status={order.status} />
						</TableCell>
						<TableCell>{order.itemCount}</TableCell>
						<TableCell>
							{formatCurrency(order.totalAmount, order.currency)}
						</TableCell>
						<TableCell>{formatDate(order.createdAt)}</TableCell>
						{action ? <TableCell>{action(order)}</TableCell> : null}
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
	form: {
		orderId: string;
		pickupLocation: string;
		dropoffLocation: string;
		distanceKm: string;
	};
	setForm: (form: {
		orderId: string;
		pickupLocation: string;
		dropoffLocation: string;
		distanceKm: string;
	}) => void;
	orders: OrderSummary[];
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	pending: boolean;
}) {
	return (
		<form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-5">
			<div className="space-y-2">
				<Label htmlFor="ride-order">Order</Label>
				<select
					id="ride-order"
					value={form.orderId}
					onChange={(event) =>
						setForm({ ...form, orderId: event.target.value })
					}
					className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
					required
				>
					<option value="">Select order</option>
					{orders.map((order) => (
						<option key={order.id} value={order.id}>
							{order.id.slice(0, 8)} -{" "}
							{formatCurrency(order.totalAmount, order.currency)}
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
	loading = false,
	action,
}: {
	rides: Ride[];
	loading?: boolean;
	action?: (ride: Ride) => ReactNode;
}) {
	if (loading) {
		return <LoadingState title="Loading rides" />;
	}

	if (rides.length === 0) {
		return <EmptyPanel message="No rides found." />;
	}

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
					{action ? <TableHead>Action</TableHead> : null}
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
							<StatusBadge status={ride.status} />
						</TableCell>
						<TableCell>{ride.driverName ?? "-"}</TableCell>
						<TableCell>
							{ride.fareAmount
								? formatCurrency(ride.fareAmount, ride.currency)
								: "-"}
						</TableCell>
						<TableCell>{formatDate(ride.requestedAt)}</TableCell>
						{action ? <TableCell>{action(ride)}</TableCell> : null}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function UserForm({
	form,
	setForm,
	roleLocked,
	pending,
	onSubmit,
	submitLabel,
}: {
	form: AdminUserRequest;
	setForm: (form: AdminUserRequest) => void;
	roleLocked?: Role;
	pending: boolean;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	submitLabel: string;
}) {
	return (
		<form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-5">
			<Field
				label="Username"
				value={form.username}
				onChange={(value) => setForm({ ...form, username: value })}
			/>
			<Field
				label="Display name"
				value={form.displayName}
				onChange={(value) => setForm({ ...form, displayName: value })}
			/>
			<Field
				label="Password"
				type="password"
				value={form.password ?? ""}
				onChange={(value) => setForm({ ...form, password: value })}
			/>
			<div className="space-y-2">
				<Label htmlFor="user-role">Role</Label>
				<select
					id="user-role"
					value={roleLocked ?? form.role}
					disabled={Boolean(roleLocked)}
					onChange={(event) =>
						setForm({ ...form, role: event.target.value as Role })
					}
					className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
				>
					{(["ADMIN", "CUSTOMER", "DRIVER"] as Role[]).map((role) => (
						<option key={role} value={role}>
							{role}
						</option>
					))}
				</select>
			</div>
			<label className="flex items-end gap-2 pb-2 text-sm">
				<input
					type="checkbox"
					checked={form.enabled}
					onChange={(event) =>
						setForm({ ...form, enabled: event.target.checked })
					}
				/>
				Enabled
			</label>
			<div className="md:col-span-5">
				<Button type="submit" disabled={pending}>
					{pending ? "Saving..." : submitLabel}
				</Button>
			</div>
		</form>
	);
}

function UserTable({
	users,
	loading,
	onEdit,
	onDisable,
}: {
	users: UserSummary[];
	loading: boolean;
	onEdit: (user: UserSummary) => void;
	onDisable: (id: string) => void;
}) {
	if (loading) {
		return <LoadingState title="Loading users" />;
	}

	if (users.length === 0) {
		return <EmptyPanel message="No users found." />;
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Username</TableHead>
					<TableHead>Role</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Created</TableHead>
					<TableHead>Action</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{users.map((user) => (
					<TableRow key={user.id}>
						<TableCell>{user.displayName}</TableCell>
						<TableCell>{user.username}</TableCell>
						<TableCell>
							<StatusBadge status={user.role} />
						</TableCell>
						<TableCell>
							<StatusBadge
								status={user.enabled ? "ENABLED" : "DISABLED"}
								label={user.enabled ? "Enabled" : "Disabled"}
							/>
						</TableCell>
						<TableCell>{formatDate(user.createdAt)}</TableCell>
						<TableCell>
							<div className="flex gap-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => onEdit(user)}
								>
									Edit
								</Button>
								<Button
									type="button"
									size="sm"
									variant="destructive"
									disabled={!user.enabled}
									onClick={() => onDisable(user.id)}
								>
									Disable
								</Button>
							</div>
						</TableCell>
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
			className={`h-8 rounded-md border px-2 text-xs font-medium ${statusColorClass(value)}`}
		>
			{options.map((option) => (
				<option key={option} value={option}>
					{option}
				</option>
			))}
		</select>
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

function EmptyPanel({ message }: { message: string }) {
	return (
		<div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
			{message}
		</div>
	);
}

function dailyOrderRevenue(orders: OrderSummary[]) {
	const days = lastDays(7);
	return days.map((day) => ({
		label: day.label,
		revenue: orders
			.filter(
				(order) =>
					order.status !== "CANCELLED" && dateKey(order.createdAt) === day.key,
			)
			.reduce((total, order) => total + order.totalAmount, 0),
	}));
}

function dailyRideCounts(rides: Ride[]) {
	const days = lastDays(7);
	return days.map((day) => ({
		label: day.label,
		completed: rides.filter(
			(ride) =>
				ride.status === "COMPLETED" &&
				ride.completedAt &&
				dateKey(ride.completedAt) === day.key,
		).length,
	}));
}

function dailyRideFares(rides: Ride[]) {
	const days = lastDays(7);
	return days.map((day) => ({
		label: day.label,
		fare: rides
			.filter(
				(ride) =>
					ride.fareAmount &&
					ride.acceptedAt &&
					dateKey(ride.acceptedAt) === day.key,
			)
			.reduce((total, ride) => total + (ride.fareAmount ?? 0), 0),
	}));
}

function statusCounts<T extends { status: string }>(
	items: T[],
	statuses: string[],
) {
	return statuses.map((status) => ({
		status,
		count: items.filter((item) => item.status === status).length,
	}));
}

function lastDays(count: number) {
	const formatter = new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
	});
	return Array.from({ length: count }, (_, index) => {
		const date = new Date();
		date.setHours(0, 0, 0, 0);
		date.setDate(date.getDate() - (count - index - 1));
		return {
			key: date.toISOString().slice(0, 10),
			label: formatter.format(date),
		};
	});
}

function dateKey(value: string) {
	return new Date(value).toISOString().slice(0, 10);
}

function compactLabel(value: string) {
	const words = value.split(/\s+/);
	if (words.length === 1) {
		return value.slice(0, 10);
	}
	return words
		.map((word) => word[0])
		.join("")
		.slice(0, 6)
		.toUpperCase();
}

function formatShortNumber(value: number) {
	return new Intl.NumberFormat(undefined, {
		notation: "compact",
		maximumFractionDigits: 1,
	}).format(value);
}

function chartColorForStatus(status: string) {
	switch (status) {
		case "DELIVERED":
		case "COMPLETED":
			return "var(--chart-2)";
		case "PENDING":
		case "REQUESTED":
			return "var(--chart-4)";
		case "SHIPPED":
		case "ACCEPTED":
			return "var(--chart-1)";
		case "CANCELLED":
			return "var(--chart-5)";
		default:
			return "var(--chart-3)";
	}
}

function matchesText(
	query: string,
	...values: Array<string | number | null | undefined>
) {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return true;
	}

	return values.some((value) =>
		String(value ?? "")
			.toLowerCase()
			.includes(normalizedQuery),
	);
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Request failed";
}

function toastError(error: unknown, fallback: string) {
	toast.error(fallback, { description: errorMessage(error) });
}

function orderStatusToast(status: OrderStatus) {
	if (status === "CANCELLED") {
		toast.warning("Order cancelled");
		return;
	}

	if (status === "DELIVERED") {
		toast.success("Order delivered");
		return;
	}

	toast.info("Order updated", { description: `Status changed to ${status}.` });
}

function rideStatusToast(status: RideStatus) {
	if (status === "CANCELLED") {
		toast.warning("Ride cancelled");
		return;
	}

	if (status === "COMPLETED") {
		toast.success("Ride completed", {
			description: "The attached order was marked delivered.",
		});
		return;
	}

	toast.info("Ride updated", { description: `Status changed to ${status}.` });
}
