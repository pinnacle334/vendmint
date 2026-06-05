"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    HomeIcon,
    ShoppingBagIcon,
    ClipboardDocumentListIcon,
    BuildingStorefrontIcon,
    Cog6ToothIcon,
    ArrowLeftStartOnRectangleIcon,
} from "@heroicons/react/24/outline";

// NOTE: Each nav item has a label, href, and icon
interface NavItem {
    label: string;
    href: string;
    icon: React.ReactElement;
}

// Dashboard navigation items
const navItems: NavItem[] = [
    {
        label: "Home",
        href: "/dashboard",
        icon: <HomeIcon className="w-5 h-5" />,
    },
    {
        label: "Products",
        href: "/dashboard/products",
        icon: <ShoppingBagIcon className="w-5 h-5" />,
    },
    {
        label: "Orders",
        href: "/dashboard/orders",
        icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
    },
    {
        label: "My Store",
        href: "/dashboard/store",
        icon: <BuildingStorefrontIcon className="w-5 h-5" />,
    },
    {
        label: "Settings",
        href: "/dashboard/settings",
        icon: <Cog6ToothIcon className="w-5 h-5" />,
    },
];

export default function Sidebar(): React.ReactElement {
    // NOTE: usePathname lets us highlight the active nav item
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col",
                "w-60 min-h-screen",
                "bg-[--color-surface]",
                "border-r border-[--color-border]",
                "px-3 py-6",
            )}
        >
            {/* Logo */}
            <Link
                href="/dashboard"
                className="text-xl font-bold text-[--color-primary] px-3 mb-8"
            >
                Vendmint
            </Link>

            {/* Nav items */}
            <nav className="flex flex-col gap-1 flex-1">
                {navItems.map((item) => {
                    // NOTE: Exact match for dashboard home, prefix match for nested pages
                    const isActive =
                        item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5",
                                "rounded-lg text-sm font-medium",
                                "transition-all duration-200",
                                isActive
                                    ? "bg-[--color-primary] text-white"
                                    : "text-[--color-muted] hover:bg-[--color-border] hover:text-[--color-text]",
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout button at bottom */}
            <button
                // NOTE: onClick will be wired to auth signout later
                onClick={() => {}}
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5",
                    "rounded-lg text-sm font-medium",
                    "text-[--color-error]",
                    "hover:bg-[--color-error]/10",
                    "transition-all duration-200 cursor-pointer",
                    "w-full",
                )}
            >
                <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
                Logout
            </button>
        </aside>
    );
}
