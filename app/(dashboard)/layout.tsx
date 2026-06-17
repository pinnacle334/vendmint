"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    const router = useRouter();
    const { user, loading } = useAuth();

    // NOTE: Controls whether the mobile sidebar drawer is open
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-sm text-muted">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <></>;
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col">
                {/* NOTE: Mobile-only topbar with hamburger button to open the sidebar */}
                <header
                    className={cn(
                        "md:hidden flex items-center gap-3",
                        "h-14 px-4 bg-surface border-b border-border",
                    )}
                >
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-text cursor-pointer"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                    <span className="text-lg font-bold">
                        <span className="text-primary">Vend</span>
                        <span className="text-accent">mint</span>
                    </span>
                </header>

                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
