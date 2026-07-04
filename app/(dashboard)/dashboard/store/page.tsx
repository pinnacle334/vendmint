"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn, getEffectivePlan } from "@/lib/utils";

export default function StoreSetupPage(): React.ReactElement {
    const { user } = useAuth();

    // Form state
    const [storeId, setStoreId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");

    // UI state
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // NOTE: Tracks the seller's effective plan, used to gate slug editing
    const [plan, setPlan] = useState<"free" | "pro">("free");

    // NOTE: Slug availability check state - only relevant once a Pro
    // seller is actively editing their slug
    const [slugStatus, setSlugStatus] = useState<
        "idle" | "checking" | "available" | "taken" | "invalid"
    >("idle");

    // NOTE: Normalizes any text into a valid slug format -
    // lowercase, spaces to hyphens, strips invalid characters
    const normalizeSlug = (value: string): string => {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    // NOTE: Generates a unique slug from the store name by checking the
    // database and appending a numeric suffix if the base slug is taken
    const generateUniqueSlug = async (baseName: string): Promise<string> => {
        const base = normalizeSlug(baseName);
        let candidate = base;
        let counter = 2;

        while (true) {
            const { data } = await supabase
                .from("stores")
                .select("id")
                .eq("slug", candidate)
                .maybeSingle();

            if (!data) return candidate;

            candidate = `${base}-${counter}`;
            counter++;
        }
    };

    // NOTE: Load the seller's profile (for plan/trial info) and their
    // existing store (if any) when the page mounts
    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            const { data: profile } = await supabase
                .from("profiles")
                .select("plan, trial_ends_at")
                .eq("id", user.id)
                .single();

            if (profile) {
                setPlan(getEffectivePlan(profile.plan, profile.trial_ends_at));
            }

            const { data: store } = await supabase
                .from("stores")
                .select("*")
                .eq("owner_id", user.id)
                .single();

            if (store) {
                setStoreId(store.id);
                setName(store.name);
                setSlug(store.slug);
                setDescription(store.description || "");
            }

            setPageLoading(false);
        };

        loadData();
    }, [user]);

    // NOTE: Pro sellers editing the slug get live normalization + availability checking
    const handleSlugChange = (value: string) => {
        const normalized = normalizeSlug(value);
        setSlug(normalized);
    };

    useEffect(() => {
        // NOTE: Only run the live availability check when a Pro seller is
        // actively editing - Free sellers never reach this since the field
        // is disabled, and first-time setup handles slug generation on submit
        if (plan !== "pro" || !storeId) return;

        if (!slug) {
            setSlugStatus("idle");
            return;
        }

        if (slug.length < 3) {
            setSlugStatus("invalid");
            return;
        }

        setSlugStatus("checking");

        const timeout = setTimeout(async () => {
            const { data } = await supabase
                .from("stores")
                .select("id")
                .eq("slug", slug)
                .maybeSingle();

            if (data && data.id !== storeId) {
                setSlugStatus("taken");
            } else {
                setSlugStatus("available");
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [slug, storeId, plan]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!name) {
            setError("Please enter your store name");
            return;
        }

        if (plan === "pro" && slugStatus === "taken") {
            setError("This store URL is already taken, please choose another");
            return;
        }

        if (plan === "pro" && slugStatus === "invalid") {
            setError("Store URL must be at least 3 characters");
            return;
        }

        setLoading(true);

        if (storeId) {
            // NOTE: Store already exists - update it. Free sellers' slug
            // state never changed since the field is disabled for them,
            // so we just save whatever is currently in `slug`
            const { error: updateError } = await supabase
                .from("stores")
                .update({ name, slug, description })
                .eq("id", storeId);

            setLoading(false);

            if (updateError) {
                setError(updateError.message);
                return;
            }
        } else {
            // NOTE: First-time setup - auto-generate a unique slug from the
            // store name, regardless of plan, since every seller gets a
            // working slug on creation, only Pro can change it afterward
            const generatedSlug = await generateUniqueSlug(name);

            const { error: insertError } = await supabase
                .from("stores")
                .insert({
                    owner_id: user?.id,
                    name,
                    slug: generatedSlug,
                    description,
                });

            setLoading(false);

            if (insertError) {
                setError(insertError.message);
                return;
            }

            setSlug(generatedSlug);
        }

        setSuccess(true);
    };

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-sm text-muted">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text">
                    {storeId ? "Edit your store" : "Set up your store"}
                </h1>
                <p className="text-sm text-muted mt-1">
                    This is how customers will see and find your store online.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className={cn(
                    "flex flex-col gap-5",
                    "bg-surface rounded-2xl border border-border",
                    "p-6",
                )}
            >
                <Input
                    label="Store Name"
                    type="text"
                    placeholder="Jane's Bakery"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                {/* Slug field - only shown once a store exists, since first-time
            setup auto-generates it on submit */}
                {storeId && (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-text">
                                Store URL
                            </label>
                            {plan === "free" && (
                                <span className="text-xs text-accent font-medium">
                                    Pro feature
                                </span>
                            )}
                        </div>

                        <Input
                            type="text"
                            value={slug}
                            disabled={plan === "free"}
                            onChange={(e) => handleSlugChange(e.target.value)}
                        />

                        {/* Live URL preview */}
                        <p className="text-xs text-muted">
                            Your store is available at:{" "}
                            <span className="text-text font-medium">
                                vendmint.com/store/{slug}
                            </span>
                        </p>

                        {/* Availability status - only relevant for Pro sellers editing */}
                        {plan === "pro" && slugStatus === "checking" && (
                            <p className="text-xs text-muted">
                                Checking availability...
                            </p>
                        )}
                        {plan === "pro" && slugStatus === "available" && (
                            <p className="text-xs text-success">
                                ✓ This URL is available
                            </p>
                        )}
                        {plan === "pro" && slugStatus === "taken" && (
                            <p className="text-xs text-error">
                                ✕ This URL is already taken
                            </p>
                        )}
                        {plan === "pro" && slugStatus === "invalid" && (
                            <p className="text-xs text-error">
                                URL must be at least 3 characters
                            </p>
                        )}

                        {/* Upgrade nudge for Free sellers */}
                        {plan === "free" && (
                            <p className="text-xs text-muted">
                                Upgrade to Pro to customize your store URL.
                            </p>
                        )}
                    </div>
                )}

                {/* Description textarea */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text">
                        Store Description
                    </label>
                    <textarea
                        placeholder="Tell customers what you sell..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className={cn(
                            "w-full px-4 py-2.5 rounded-lg text-sm",
                            "bg-surface text-text",
                            "border border-border",
                            "placeholder:text-muted",
                            "outline-none transition-all duration-200",
                            "focus:border-primary focus:ring-2 focus:ring-primary/20",
                            "resize-none",
                        )}
                    />
                </div>

                {/* Error / success messages */}
                {error && <p className="text-sm text-error">{error}</p>}
                {success && (
                    <p className="text-sm text-success">
                        Store {storeId ? "updated" : "created"} successfully!
                        {!storeId && (
                            <>
                                {" "}
                                Your store URL is{" "}
                                <strong>vendmint.com/store/{slug}</strong>
                            </>
                        )}
                    </p>
                )}

                <Button type="submit" loading={loading} className="self-start">
                    {storeId ? "Save Changes" : "Create Store"}
                </Button>
            </form>
        </div>
    );
}
