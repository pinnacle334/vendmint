"use client";

import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalRevenue: number;
}

export default function DashboardHomePage(): React.ReactElement {
  const { user } = useAuth();
  const { effectivePlan, isTrialActive, trialDaysLeft } = usePlan();

  const fullName = user?.user_metadata?.full_name as string | undefined;
  const firstName = fullName?.split(" ")[0] || "there";

  const [store, setStore] = useState<{ name: string; slug: string } | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      // NOTE: Get seller's store
      const { data: storeData } = await supabase
        .from("stores")
        .select("id, name, slug")
        .eq("owner_id", user.id)
        .single();

      if (!storeData) {
        setStoreLoading(false);
        return;
      }

      setStore({ name: storeData.name, slug: storeData.slug });

      // NOTE: Run all stats queries in parallel for performance
      const [
        totalOrdersRes,
        pendingOrdersRes,
        totalProductsRes,
        revenueRes,
      ] = await Promise.all([
        // Total orders
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeData.id),

        // Pending orders
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeData.id)
          .eq("payment_status", "pending"),

        // Total products
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeData.id),

        // Total revenue - only from paid orders
        supabase
          .from("orders")
          .select("total_price")
          .eq("store_id", storeData.id)
          .eq("payment_status", "paid"),
      ]);

      // NOTE: Sum up revenue from all paid orders
      const totalRevenue = (revenueRes.data || []).reduce(
        (sum, order) => sum + Number(order.total_price),
        0,
      );

      setStats({
        totalOrders: totalOrdersRes.count || 0,
        pendingOrders: pendingOrdersRes.count || 0,
        totalProducts: totalProductsRes.count || 0,
        totalRevenue,
      });

      setStoreLoading(false);
    };

    loadData();
  }, [user]);

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

      {/* Plan status card - shown during active trial */}
      {isTrialActive && (
        <Card
          padding="md"
          className={cn(
            "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
            "border-primary/30 bg-primary/5",
          )}
        >
          <div>
            <p className="text-sm font-semibold text-primary">
              🎉 You are on a Pro Trial
            </p>
            <p className="text-xs text-muted mt-0.5">
              {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} remaining —
              enjoy full Pro access while your trial is active.
            </p>
          </div>
          <Link href="/dashboard/settings">
            <Button size="sm" variant="outline">
              Upgrade to Pro
            </Button>
          </Link>
        </Card>
      )}

      {/* Upgrade nudge - shown when trial expired and on free */}
      {!isTrialActive && effectivePlan === "free" && (
        <Card
          padding="md"
          className={cn(
            "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
            "border-accent/30 bg-accent/5",
          )}
        >
          <div>
            <p className="text-sm font-semibold text-accent">
              You are on the Free Plan
            </p>
            <p className="text-xs text-muted mt-0.5">
              Upgrade to Pro to unlock card payments, more products, and full
              order history.
            </p>
          </div>
          <Link href="/dashboard/settings">
            <Button size="sm" variant="outline">
              Upgrade to Pro
            </Button>
          </Link>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="lg">
          <p className="text-sm text-muted">Total Orders</p>
          <p className="text-2xl font-bold text-text mt-1">
            {stats.totalOrders}
          </p>
        </Card>
        <Card padding="lg">
          <p className="text-sm text-muted">Pending Orders</p>
          <p className="text-2xl font-bold text-text mt-1">
            {stats.pendingOrders}
          </p>
        </Card>
        <Card padding="lg">
          <p className="text-sm text-muted">Products</p>
          <p className="text-2xl font-bold text-text mt-1">
            {stats.totalProducts}
          </p>
        </Card>
        <Card padding="lg">
          <p className="text-sm text-muted">Total Revenue</p>
          <p className="text-2xl font-bold text-primary mt-1">
            ₦{stats.totalRevenue.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Store status card */}
      {!storeLoading && (
        store ? (
          <Card
            padding="lg"
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <p className="text-sm font-semibold text-text">
                🏪 {store.name}
              </p>
              <p className="text-xs text-muted mt-0.5">
                vendmint.com/store/{store.slug}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/store/${store.slug}`} target="_blank">
                <Button size="sm" variant="outline">
                  View Store
                </Button>
              </Link>
              <Link href="/dashboard/store">
                <Button size="sm" variant="ghost">
                  Edit Store
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
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
            <Link href="/dashboard/store">
              <Button className="mt-2">Set Up Store</Button>
            </Link>
          </Card>
        )
      )}
    </div>
  );
}