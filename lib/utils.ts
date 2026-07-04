import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// NOTE: Full plan status info - whether the seller is effectively Pro,
// whether that's because of an active trial, and how many days remain
interface PlanStatus {
  effectivePlan: "free" | "pro";
  isTrialActive: boolean;
  trialDaysLeft: number | null;
}

// NOTE: Determines a seller's effective plan - returns "pro" if they are
// either a real paying Pro subscriber, OR still within their 30-day trial
// window. Falls back to their actual stored plan otherwise (normally "free").
export function getEffectivePlan(
  plan: string,
  trialEndsAt: string | null,
): PlanStatus {
  // NOTE: Real paying Pro subscribers are never on a "trial"
  if (plan === "pro") {
    return { effectivePlan: "pro", isTrialActive: false, trialDaysLeft: null };
  }

  if (trialEndsAt) {
    const trialEndDate = new Date(trialEndsAt);
    const now = new Date();
    const isTrialActive = trialEndDate > now;

    if (isTrialActive) {
      // NOTE: Round up so "0.3 days left" still shows as "1 day left"
      // rather than confusingly showing 0
      const msLeft = trialEndDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

      return { effectivePlan: "pro", isTrialActive: true, trialDaysLeft: daysLeft };
    }
  }

  return { effectivePlan: "free", isTrialActive: false, trialDaysLeft: null };
}