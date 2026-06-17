"use client";

import { useAuth } from "@/context/AuthContext";
import Card from "@/components/ui/Card";

export default function DashboardHomePage(): React.ReactElement {
    const { user } = useAuth();

    // NOTE: Extract first name from full_name metadata for a friendlier greeting
    const fullName = user?.user_metadata?.full_name as string | undefined;
    const firstName = fullName?.split(" ")[0] || "Vendmint User";

    return (
        <div className="flex flex-col gap-6">
            {/* Greeting */}
            <div>
                <h1 className="text-2xl font-bold text-text">
                    Welcome back, {firstName} 👋
                </h1>
                <p className="text-sm text-muted mt-1">
                    Here's what's happening with your store today.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card padding="lg">
                    <p className="text-sm text-muted">Total Orders</p>
                    <p className="text-2xl font-bold text-text mt-1">0</p>
                </Card>

                <Card padding="lg">
                    <p className="text-sm text-muted">Pending Orders</p>
                    <p className="text-2xl font-bold text-text mt-1">0</p>
                </Card>

                <Card padding="lg">
                    <p className="text-sm text-muted">Products</p>
                    <p className="text-2xl font-bold text-text mt-1">0</p>
                </Card>

                <Card padding="lg">
                    <p className="text-sm text-muted">Total Revenue</p>
                    <p className="text-2xl font-bold text-primary mt-1">₦0</p>
                </Card>
            </div>

            {/* Empty state - no store yet */}
            <Card
                padding="lg"
                className="flex flex-col items-center text-center gap-3 py-12"
            >
                <p className="text-lg font-semibold text-text">
                    You haven't set up your store yet
                </p>
                <p className="text-sm text-muted max-w-sm">
                    Set up your store profile to start adding products and
                    receiving orders from customers.
                </p>
            </Card>
        </div>
    );
}
