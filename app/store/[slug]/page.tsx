"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import {
    ShoppingCartIcon,
    PlusIcon,
    MinusIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface Store {
    id: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    owner_id: string;
}

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    category: string | null;
    is_available: boolean;
}

export default function StorePage(): React.ReactElement {
    const params = useParams();
    const slug = params.slug as string;
    const { items, addItem, updateQuantity, totalItems, totalPrice } =
        useCart();

    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!slug) return;

        const loadStore = async () => {
            const { data: store, error: storeError } = await supabase
                .from("stores")
                .select("id, name, description, logo_url, owner_id")
                .eq("slug", slug)
                .eq("is_active", true)
                .single();

            if (storeError || !store) {
                setNotFound(true);
                setLoading(false);
                return;
            }

            setStore(store);

            const { data: products } = await supabase
                .from("products")
                .select(
                    "id, name, description, price, image_url, category, is_available",
                )
                .eq("store_id", store.id)
                .eq("is_available", true)
                .order("created_at", { ascending: false });

            setProducts(products || []);
            setLoading(false);
        };

        loadStore();
    }, [slug]);

    const getItemQuantity = (productId: string) => {
        return items.find((item) => item.id === productId)?.quantity || 0;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-sm text-muted">Loading store...</p>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3 px-4">
                <p className="text-lg font-bold text-text">Store not found</p>
                <p className="text-sm text-muted text-center">
                    This store doesn't exist or is currently unavailable.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Store header */}
            <div className="bg-surface border-b border-border">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        {store?.logo_url ? (
                            <img
                                src={store.logo_url}
                                alt={store?.name}
                                className="w-16 h-16 rounded-full object-cover border border-border"
                            />
                        ) : (
                            <div
                                className={cn(
                                    "w-16 h-16 rounded-full",
                                    "bg-primary/10 flex items-center justify-center",
                                    "text-primary text-2xl font-bold",
                                )}
                            >
                                {store?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-text">
                                {store?.name}
                            </h1>
                            {store?.description && (
                                <p className="text-sm text-muted mt-0.5">
                                    {store.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Products section */}
            <div className="max-w-3xl mx-auto px-4 py-6">
                {products.length === 0 ? (
                    <div className="flex flex-col items-center text-center gap-2 py-16">
                        <p className="text-base font-semibold text-text">
                            No products available yet
                        </p>
                        <p className="text-sm text-muted">Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {products.map((product) => {
                            const quantity = getItemQuantity(product.id);

                            return (
                                <div
                                    key={product.id}
                                    className={cn(
                                        "bg-surface rounded-xl border border-border",
                                        "overflow-hidden flex flex-col",
                                    )}
                                >
                                    <div className="w-full h-36 bg-border overflow-hidden">
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

                                    <div className="p-3 flex flex-col gap-2 flex-1">
                                        <div>
                                            <p className="text-sm font-semibold text-text line-clamp-1">
                                                {product.name}
                                            </p>
                                            {product.description && (
                                                <p className="text-xs text-muted line-clamp-2 mt-0.5">
                                                    {product.description}
                                                </p>
                                            )}
                                        </div>

                                        <p className="text-sm font-bold text-primary">
                                            ₦{product.price.toLocaleString()}
                                        </p>

                                        {quantity === 0 ? (
                                            <button
                                                onClick={() =>
                                                    addItem({
                                                        id: product.id,
                                                        name: product.name,
                                                        price: product.price,
                                                        image_url:
                                                            product.image_url,
                                                    })
                                                }
                                                className={cn(
                                                    "w-full py-2 rounded-lg text-xs font-medium",
                                                    "bg-primary text-white",
                                                    "transition-colors duration-200",
                                                    "hover:bg-primary-dark",
                                                )}
                                            >
                                                Add to cart
                                            </button>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            product.id,
                                                            quantity - 1,
                                                        )
                                                    }
                                                    className={cn(
                                                        "w-7 h-7 rounded-full",
                                                        "bg-border flex items-center justify-center",
                                                        "cursor-pointer hover:bg-primary hover:text-white",
                                                        "transition-colors duration-200",
                                                    )}
                                                >
                                                    <MinusIcon className="w-3 h-3" />
                                                </button>
                                                <span className="text-sm font-semibold text-text">
                                                    {quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        addItem({
                                                            id: product.id,
                                                            name: product.name,
                                                            price: product.price,
                                                            image_url:
                                                                product.image_url,
                                                        })
                                                    }
                                                    className={cn(
                                                        "w-7 h-7 rounded-full",
                                                        "bg-primary text-white flex items-center justify-center",
                                                        "cursor-pointer hover:bg-primary-dark",
                                                        "transition-colors duration-200",
                                                    )}
                                                >
                                                    <PlusIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Sticky cart bar */}
            {totalItems > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
                    <Link href={`/store/${slug}/checkout`}>
                        <div
                            className={cn(
                                "max-w-3xl mx-auto",
                                "bg-primary text-white",
                                "rounded-2xl px-5 py-4",
                                "flex items-center justify-between",
                                "shadow-lg cursor-pointer",
                                "hover:bg-primary-dark transition-colors duration-200",
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full bg-white/20",
                                        "flex items-center justify-center",
                                    )}
                                >
                                    <ShoppingCartIcon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">
                                    {totalItems} item
                                    {totalItems === 1 ? "" : "s"} in cart
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">
                                    ₦{totalPrice.toLocaleString()}
                                </span>
                                <span className="text-sm">→ Checkout</span>
                            </div>
                        </div>
                    </Link>
                </div>
            )}

            {/* Vendmint branding footer */}
            <div className="text-center py-6 pb-24">
                <p className="text-xs text-muted">
                    Powered by{" "}
                    <span className="font-semibold">
                        <span className="text-primary">Vend</span>
                        <span className="text-accent">mint</span>
                    </span>
                </p>
            </div>
        </div>
    );
}
