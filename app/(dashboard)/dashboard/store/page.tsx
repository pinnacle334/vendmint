"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function StoreSetupPage(): React.ReactElement {
    const { user } = useAuth();
    const router = useRouter();

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

    // NOTE: Slug availability check state
    const [slugStatus, setSlugStatus] = useState<
  "idle" | "checking" | "available" | "taken" | "invalid"
>("idle");
    // NOTE: Load the seller's existing store (if any) when the page mounts,
    // so this page works for both first-time setup and later editing
    useEffect(() => {
        if (!user) return;

        const loadStore = async () => {
            const { data } = await supabase
                .from("stores")
                .select("*")
                .eq("owner_id", user.id)
                .single();

            if (data) {
                setStoreId(data.id);
                setName(data.name);
                setSlug(data.slug);
                setDescription(data.description || "");
            }

            setPageLoading(false);
        };

        loadStore();
    }, [user]);

    // NOTE: Normalizes whatever the seller types into a valid slug format -
    // lowercase, spaces to hyphens, strips invalid characters
    const normalizeSlug = (value: string): string => {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    const handleSlugChange = (value: string) => {
        const normalized = normalizeSlug(value);
        setSlug(normalized);
    };

    // NOTE: Debounced slug availability check - waits 500ms after the
    // seller stops typing before querying the database
    useEffect(() => {
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

            // NOTE: If a store with this slug exists and it's not our own
            // store (relevant when editing), the slug is taken
            if (data && data.id !== storeId) {
                setSlugStatus("taken");
            } else {
                setSlugStatus("available");
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [slug, storeId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!name || !slug) {
            setError("Please fill in your store name and slug");
            return;
        }

        if (slugStatus === "taken") {
            setError("This store URL is already taken, please choose another");
            return;
        }

        if (slugStatus === "invalid") {
            setError("Store URL must be at least 3 characters");
            return;
        }

        setLoading(true);

        if (storeId) {
            // NOTE: Store already exists - update it
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
            // NOTE: No store yet - create one, linked to the logged in seller
            const { error: insertError } = await supabase
                .from("stores")
                .insert({
                    owner_id: user?.id,
                    name,
                    slug,
                    description,
                });

            setLoading(false);

            if (insertError) {
                setError(insertError.message);
                return;
            }
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

                {/* Slug field with live preview and availability status */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text">
                        Store URL
                    </label>

                    <Input
                        type="text"
                        placeholder="janes-bakery"
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                    />

                    {/* Live URL preview */}
                    <p className="text-xs text-muted">
                        Your store will be available at:{" "}
                        <span className="text-text font-medium">
                            vendmint.com/store/{slug || "your-store-name"}
                        </span>
                    </p>

                    {/* Availability status indicator */}
                    {slugStatus === "checking" && (
                        <p className="text-xs text-muted">
                            Checking availability...
                        </p>
                    )}
                    {slugStatus === "available" && (
                        <p className="text-xs text-success">
                            ✓ This URL is available
                        </p>
                    )}
                    {slugStatus === "taken" && (
                        <p className="text-xs text-error">
                            ✕ This URL is already taken
                        </p>
                    )}
                    {slugStatus === "invalid" && (
                        <p className="text-xs text-error">
                            URL must be at least 3 characters
                        </p>
                    )}
                </div>

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
                    </p>
                )}

                <Button type="submit" loading={loading} className="self-start">
                    {storeId ? "Save Changes" : "Create Store"}
                </Button>
            </form>
        </div>
    );
}
