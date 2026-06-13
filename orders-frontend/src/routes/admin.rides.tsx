import {Outlet, createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/admin/rides")({
    component: Outlet,
});
