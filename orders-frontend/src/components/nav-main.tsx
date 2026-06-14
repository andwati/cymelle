import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible.tsx";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "#/components/ui/sidebar.tsx";

const openSectionsStorageKey = "cymelle.sidebar.open-sections";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon?: LucideIcon;
		isActive?: boolean;
		items?: {
			title: string;
			url: string;
		}[];
	}[];
}) {
	const location = useLocation();
	const previousPath = useRef<string | null>(null);
	const [openSections, setOpenSections] = useState<Set<string>>(() => {
		const itemTitles = new Set(items.map((item) => item.title));
		const storedSections = readOpenSections().filter((title) =>
			itemTitles.has(title),
		);

		if (storedSections.length > 0) {
			return new Set(storedSections);
		}

		return new Set(
			items
				.filter((item) => isItemActive(item, location.pathname))
				.map((item) => item.title),
		);
	});

	useEffect(() => {
		writeOpenSections([...openSections]);
	}, [openSections]);

	useEffect(() => {
		if (previousPath.current === location.pathname) {
			return;
		}

		previousPath.current = location.pathname;
		setOpenSections((current) => {
			const next = new Set(current);
			items
				.filter((item) => isItemActive(item, location.pathname))
				.forEach((item) => {
					next.add(item.title);
				});
			return next;
		});
	}, [items, location.pathname]);

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Commerce</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						key={item.title}
						asChild
						open={openSections.has(item.title)}
						onOpenChange={(open) => {
							setOpenSections((current) => {
								const next = new Set(current);
								if (open) {
									next.add(item.title);
								} else {
									next.delete(item.title);
								}
								return next;
							});
						}}
						className="group/collapsible"
					>
						<SidebarMenuItem>
							<CollapsibleTrigger asChild>
								<SidebarMenuButton tooltip={item.title}>
									{item.icon && <item.icon />}
									<span>{item.title}</span>
									<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
								</SidebarMenuButton>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<SidebarMenuSub>
									{item.items?.map((subItem) => (
										<SidebarMenuSubItem key={subItem.title}>
											<SidebarMenuSubButton asChild>
												<Link to={subItem.url}>
													<span>{subItem.title}</span>
												</Link>
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									))}
								</SidebarMenuSub>
							</CollapsibleContent>
						</SidebarMenuItem>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}

function readOpenSections() {
	if (typeof window === "undefined") {
		return [];
	}

	const raw = window.localStorage.getItem(openSectionsStorageKey);
	if (!raw) {
		return [];
	}

	try {
		const value = JSON.parse(raw);
		return Array.isArray(value)
			? value.filter((item) => typeof item === "string")
			: [];
	} catch {
		window.localStorage.removeItem(openSectionsStorageKey);
		return [];
	}
}

function writeOpenSections(sections: string[]) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(openSectionsStorageKey, JSON.stringify(sections));
}

function isItemActive(
	item: {
		url: string;
		isActive?: boolean;
		items?: { url: string }[];
	},
	pathname: string,
) {
	if (item.items?.some((subItem) => pathname === subItem.url)) {
		return true;
	}

	return pathname === item.url || (Boolean(item.isActive) && pathname === "/");
}
