"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";

// NOTE: Product type matching our Supabase schema
interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    is_available: boolean;
    category: string | null;
    created_at: string;
}

// NOTE: Free tier limit as defined in our tier plan document
const FREE_PRODUCT_LIMIT = 6;
const PRO_PRODUCT_LIMIT = 50;

export default function ProductsPage(): React.ReactElement {
    const { user } = useAuth();
    const { effectivePlan } = usePlan();

    const [products, setProducts] = useState<Product[]>([]);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState("");

    // NOTE: Determine product limit based on effective plan
    const productLimit =
        effectivePlan === "pro" ? PRO_PRODUCT_LIMIT : FREE_PRODUCT_LIMIT;
    const canAddMore = products.length < productLimit;

    useEffect(() => {
        if (!user) return;

        const loadProducts = async () => {
            // NOTE: First get the seller's store
            const { data: store } = await supabase
                .from("stores")
                .select("id")
                .eq("owner_id", user.id)
                .single();

            if (!store) {
                setLoading(false);
                return;
            }

            setStoreId(store.id);

            // NOTE: Then get all products for that store
            const { data: products, error } = await supabase
                .from("products")
                .select("*")
                .eq("store_id", store.id)
                .order("created_at", { ascending: false });

            if (error) {
                setError(error.message);
            } else {
                setProducts(products || []);
            }

            setLoading(false);
        };

        loadProducts();
    }, [user]);

    const handleDelete = async (productId: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        setDeletingId(productId);

        // NOTE: Delete the product from the database
        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", productId);

        if (error) {
            setError(error.message);
            setDeletingId(null);
            return;
        }

        // NOTE: Remove from local state without refetching
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setDeletingId(null);
    };

    const handleToggleAvailability = async (
        productId: string,
        currentValue: boolean,
    ) => {
        // NOTE: Optimistically update UI before the DB call resolves
        setProducts((prev) =>
            prev.map((p) =>
                p.id === productId ? { ...p, is_available: !currentValue } : p,
            ),
        );

        const { error } = await supabase
            .from("products")
            .update({ is_available: !currentValue })
            .eq("id", productId);

        if (error) {
            // NOTE: Revert optimistic update if the DB call fails
            setProducts((prev) =>
                prev.map((p) =>
                    p.id === productId
                        ? { ...p, is_available: currentValue }
                        : p,
                ),
            );
            setError(error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-sm text-muted">Loading products...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text">Products</h1>
                    <p className="text-sm text-muted mt-1">
                        {products.length} of {productLimit} products used
                    </p>
                </div>

                {/* NOTE: Disable add button if seller has reached their plan limit */}
                {canAddMore ? (
                    <Link href="/dashboard/products/new">
                        <Button size="sm">
                            <PlusIcon className="w-4 h-4" />
                            Add Product
                        </Button>
                    </Link>
                ) : (
                    <div className="flex flex-col items-end gap-1">
                        <Button size="sm" disabled>
                            <PlusIcon className="w-4 h-4" />
                            Add Product
                        </Button>
                        <p className="text-xs text-error">
                            {effectivePlan === "free"
                                ? `Free plan limit reached (${FREE_PRODUCT_LIMIT} products)`
                                : `Pro plan limit reached (${PRO_PRODUCT_LIMIT} products)`}
                        </p>
                    </div>
                )}
            </div>

            {/* No store warning */}
            {!storeId && (
                <Card padding="lg" className="text-center">
                    <p className="text-sm font-medium text-text">
                        You need to set up your store first
                    </p>
                    <p className="text-xs text-muted mt-1 mb-4">
                        Products belong to your store — set it up before adding
                        products.
                    </p>
                    <Link href="/dashboard/store">
                        <Button size="sm">Set Up Store</Button>
                    </Link>
                </Card>
            )}

            {/* Error message */}
            {error && <p className="text-sm text-error">{error}</p>}

            {/* Empty state */}
            {storeId && products.length === 0 && (
                <Card
                    padding="lg"
                    className="flex flex-col items-center text-center gap-3 py-12"
                >
                    <p className="text-lg font-semibold text-text">
                        No products yet
                    </p>
                    <p className="text-sm text-muted max-w-sm">
                        Add your first product so customers can start placing
                        orders.
                    </p>
                    <Link href="/dashboard/products/new">
                        <Button className="mt-2">
                            <PlusIcon className="w-4 h-4" />
                            Add Your First Product
                        </Button>
                    </Link>
                </Card>
            )}

            {/* Products grid */}
            {storeId && products.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                        <Card
                            key={product.id}
                            padding="none"
                            className="overflow-hidden"
                        >
                            {/* Product image */}
                            <div className="w-full h-48 bg-border overflow-hidden">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <p className="text-xs text-muted">
                                            No image
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Product details */}
                            <div className="p-4 flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-text">
                                            {product.name}
                                        </p>
                                        {product.category && (
                                            <p className="text-xs text-muted mt-0.5">
                                                {product.category}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-primary shrink-0">
                                        ₦{product.price.toLocaleString()}
                                    </p>
                                </div>

                                {product.description && (
                                    <p className="text-xs text-muted line-clamp-2">
                                        {product.description}
                                    </p>
                                )}

                                {/* Availability toggle */}
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() =>
                                            handleToggleAvailability(
                                                product.id,
                                                product.is_available,
                                            )
                                        }
                                        className={cn(
                                            "flex items-center gap-1.5 text-xs font-medium",
                                            "transition-colors duration-200 cursor-pointer",
                                            product.is_available
                                                ? "text-success"
                                                : "text-muted",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "w-2 h-2 rounded-full",
                                                product.is_available
                                                    ? "bg-success"
                                                    : "bg-muted",
                                            )}
                                        />
                                        {product.is_available
                                            ? "Available"
                                            : "Unavailable"}
                                    </button>

                                    {/* Edit and delete actions */}
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/dashboard/products/${product.id}/edit`}
                                        >
                                            <button className="text-muted hover:text-primary transition-colors duration-200 cursor-pointer">
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() =>
                                                handleDelete(product.id)
                                            }
                                            disabled={deletingId === product.id}
                                            className="text-muted hover:text-error transition-colors duration-200 cursor-pointer disabled:opacity-50"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Plan limit progress bar */}
            {storeId && products.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted">Product slots used</p>
                        <p className="text-xs text-muted">
                            {products.length}/{productLimit}
                        </p>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-300",
                                products.length >= productLimit
                                    ? "bg-error"
                                    : products.length >= productLimit * 0.8
                                      ? "bg-accent"
                                      : "bg-primary",
                            )}
                            style={{
                                width: `${Math.min((products.length / productLimit) * 100, 100)}%`,
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
