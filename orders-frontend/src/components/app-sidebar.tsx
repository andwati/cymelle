"use client"

import * as React from "react"
import {
  Boxes,
  Car,
  GalleryVerticalEnd,
  LayoutDashboard,
  ReceiptText,
  ShoppingCart,
  Store,
  Truck,
  Users,
} from "lucide-react"

import { NavMain } from "#/components/nav-main.tsx"
import { NavUser } from "#/components/nav-user.tsx"
import { TeamSwitcher } from "#/components/team-switcher.tsx"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "#/components/ui/sidebar.tsx"
import type { AuthUser, Role } from "#/types/auth.ts"

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin workspace",
  CUSTOMER: "Customer store",
  DRIVER: "Driver workspace",
}

const navMainByRole: Record<Role, React.ComponentProps<typeof NavMain>["items"]> = {
  ADMIN: [
    {
      title: "Overview",
      url: "/admin",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        { title: "Operations", url: "/admin" },
        { title: "Inventory health", url: "/admin/inventory" },
      ],
    },
    {
      title: "Products",
      url: "/admin/products",
      icon: Boxes,
      items: [
        { title: "Product catalog", url: "/admin/products" },
        { title: "Create product", url: "/admin/products/new" },
      ],
    },
    {
      title: "Orders",
      url: "/admin/orders",
      icon: ReceiptText,
      items: [
        { title: "Pending orders", url: "/admin/orders/pending" },
        { title: "Shipment status", url: "/admin/orders" },
      ],
    },
    {
      title: "Rides",
      url: "/admin/rides",
      icon: Car,
      items: [
        { title: "Ride requests", url: "/admin/rides/requested" },
        { title: "Driver assignments", url: "/admin/rides/accepted" },
      ],
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: Users,
      items: [
        { title: "All users", url: "/admin/users" },
        { title: "Customers", url: "/admin/customers" },
        { title: "Drivers", url: "/admin/drivers" },
      ],
    },
  ],
  CUSTOMER: [
    {
      title: "Overview",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        { title: "Dashboard", url: "/" },
        { title: "Order history", url: "/orders" },
      ],
    },
    {
      title: "Storefront",
      url: "/products",
      icon: Store,
      items: [
        { title: "Product listing", url: "/products" },
        { title: "Featured inventory", url: "/products/featured" },
      ],
    },
    {
      title: "Cart",
      url: "/cart",
      icon: ShoppingCart,
      items: [
        { title: "Review cart", url: "/cart" },
        { title: "Checkout", url: "/cart" },
      ],
    },
    {
      title: "Orders",
      url: "/orders",
      icon: ReceiptText,
      items: [
        { title: "Order history", url: "/orders" },
        { title: "Delivery status", url: "/orders/status" },
      ],
    },
    {
      title: "Rides",
      url: "/rides",
      icon: Car,
      items: [
        { title: "Request a ride", url: "/rides/new" },
        { title: "Ride history", url: "/rides" },
      ],
    },
  ],
  DRIVER: [
    {
      title: "Overview",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        { title: "Dashboard", url: "/" },
        { title: "Completed rides", url: "/driver/rides/completed" },
      ],
    },
    {
      title: "Ride board",
      url: "/driver/rides",
      icon: Car,
      items: [
        { title: "Requested rides", url: "/driver/rides/requested" },
        { title: "Accepted rides", url: "/driver/rides/accepted" },
      ],
    },
    {
      title: "Routes",
      url: "/driver/rides/accepted",
      icon: Truck,
      items: [
        { title: "Active route", url: "/driver/rides/accepted" },
        { title: "Completed rides", url: "/driver/rides/completed" },
      ],
    },
  ],
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: AuthUser
  onLogout?: () => void
}

export function AppSidebar({ user, onLogout, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={[
            {
              name: "Cymelle",
              logo: GalleryVerticalEnd,
              plan: roleLabels[user.role],
            },
          ]}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainByRole[user.role]} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.displayName,
            email: user.username,
            avatar: "",
          }}
          onLogout={onLogout}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
