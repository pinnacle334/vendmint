"use client";

import Link from "next/link";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  Cog6ToothIcon,
  ArrowLeftStartOnRectangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactElement;
}

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

// NOTE: isOpen and onClose control the mobile slide-in drawer behavior.
// On desktop the sidebar is always visible regardless of these props.
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps): React.ReactElement {
  const pathname = usePathname();
  const { effectivePlan, isTrialActive, trialDaysLeft } = usePlan();
  const { signOut } = useAuth();

  return (
    <>
      {/* NOTE: Overlay behind the drawer on mobile - clicking it closes the sidebar */}
      {isOpen && (
        <div
          onClick={onClose}
          className={cn(
            "fixed inset-0 z-40 bg-black/50",
            "md:hidden",
          )}
        />
      )}

      <aside
        className={cn(
          "flex flex-col",
          "w-60 min-h-screen",
          "bg-surface",
          "border-r border-border",
          "px-3 py-6",
          "fixed top-0 left-0 z-50 transition-transform duration-300",
          "md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo + mobile close button */}
        <div className="flex items-center justify-between px-3 mb-8">
          <Link href="/dashboard" className="text-xl font-bold">
            <span className="text-primary">Vend</span>
            <span className="text-accent">mint</span>
          </Link>

          {/* NOTE: Close button only shows on mobile */}
          <button
            onClick={onClose}
            className="md:hidden text-muted hover:text-text cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Plan badge */}
        <div
          className={cn(
            "mx-3 mb-4 px-3 py-2 rounded-lg text-xs font-medium",
            effectivePlan === "pro"
              ? "bg-primary/10 text-primary"
              : "bg-border text-muted",
          )}
        >
          {effectivePlan === "pro" && isTrialActive
            ? `Pro Trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`
            : effectivePlan === "pro"
              ? "Pro Plan"
              : "Free Plan"}
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5",
                  "rounded-lg text-sm font-medium",
                  "transition-all duration-200",
                  isActive
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-border hover:text-text",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* NOTE: Logout button - calls signOut from AuthContext which
            clears the session and redirects to /login */}
        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5",
            "rounded-lg text-sm font-medium",
            "text-error hover:bg-error/10",
            "transition-all duration-200 cursor-pointer",
            "w-full",
          )}
        >
          <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </aside>
    </>
  );
}