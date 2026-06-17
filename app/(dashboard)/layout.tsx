"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        // NOTE: Only redirect once the initial session check is done
        // (loading is false) to avoid redirecting before we know
        // whether the user is actually logged in
        if (!loading && !user) {
            router.push("/login");
        }
    }, [loading, user, router]);

    // NOTE: Show a simple loading state while checking the session
    // to avoid flashing the dashboard or redirecting prematurely
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-sm text-muted">Loading...</p>
            </div>
        );
    }

    // NOTE: If there's no user after loading finishes, render nothing
    // while the redirect in useEffect kicks in
    if (!user) {
        return <></>;
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 p-6">{children}</main>
        </div>
    );
}
