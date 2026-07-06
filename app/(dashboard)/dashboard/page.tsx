"use client";

import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardHomePage(): React.ReactElement {
  const { user } = useAuth();
  const { effectivePlan, isTrialActive, trialDaysLeft, loading } = usePlan();

  // NOTE: Extract first name from full_name metadata for a friendlier greeting
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const firstName = fullName?.split(" ")[0] || "there";

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

      {/* TEMPORARY DEBUG - remove after */}
      {/* <div className="text-xs bg-yellow-100 p-3 rounded">
        <p>effectivePlan: {effectivePlan}</p>
        <p>isTrialActive: {String(isTrialActive)}</p>
        <p>trialDaysLeft: {String(trialDaysLeft)}</p>
        <p>loading: {String(loading)}</p>
      </div> */}

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

      {/* Empty state */}
      <Card
        padding="lg"
        className="flex flex-col items-center text-center gap-3 py-12"
      >
        <p className="text-lg font-semibold text-text">
          You haven't set up your store yet
        </p>
        <p className="text-sm text-muted max-w-sm">
          Set up your store profile to start adding products and receiving
          orders from customers.
        </p>
        <Link href="/dashboard/store">
          <Button className="mt-2">Set Up Store</Button>
        </Link>
      </Card>
    </div>
  );
}