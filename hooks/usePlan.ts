"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getEffectivePlan } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface PlanInfo {
  effectivePlan: "free" | "pro";
  isTrialActive: boolean;
  trialDaysLeft: number | null;
  loading: boolean;
}

// NOTE: Custom hook that fetches the seller's plan and trial status
// from the profiles table and returns it in a ready-to-use shape.
// Used by any component that needs to know the seller's current plan.
export function usePlan(): PlanInfo {
  const { user } = useAuth();

  const [effectivePlan, setEffectivePlan] = useState<"free" | "pro">("free");
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPlan = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, trial_ends_at")
        .eq("id", user.id)
        .single();

      if (profile) {
        const status = getEffectivePlan(profile.plan, profile.trial_ends_at);
        setEffectivePlan(status.effectivePlan);
        setIsTrialActive(status.isTrialActive);
        setTrialDaysLeft(status.trialDaysLeft);
      }

      setLoading(false);
    };

    fetchPlan();
  }, [user]);

  return { effectivePlan, isTrialActive, trialDaysLeft, loading };
}