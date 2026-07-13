"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { EyeIcon, XMarkIcon } from "@heroicons/react/24/outline";

// NOTE: Order type matching our Supabase schema
interface Order {
    id: string;
    product_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    delivery_address: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    payment_method: string;
    payment_status: string;
    order_status: string;
    proof_of_payment_url: string | null;
    created_at: string;
    products: {
        name: string;
        image_url: string | null;
    } | null;
}

// NOTE: Maps payment/order status values to Badge variants
const paymentStatusVariant = (status: string) => {
    switch (status) {
        case "paid":
            return "success";
        case "pending":
            return "warning";
        case "failed":
            return "error";
        default:
            return "default";
    }
};

const orderStatusVariant = (status: string) => {
    switch (status) {
        case "completed":
            return "success";
        case "confirmed":
            return "info";
        case "preparing":
            return "info";
        case "out_for_delivery":
            return "info";
        case "pending":
            return "warning";
        case "cancelled":
            return "error";
        default:
            return "default";
    }
};

const orderStatusLabel = (status: string) => {
    switch (status) {
        case "pending":
            return "Pending";
        case "confirmed":
            return "Confirmed";
        case "preparing":
            return "Preparing";
        case "out_for_delivery":
            return "Out for Delivery";
        case "completed":
            return "Completed";
        case "cancelled":
            return "Cancelled";
        default:
            return status;
    }
};

export default function OrdersPage(): React.ReactElement {
    const { user } = useAuth();

    const [orders, setOrders] = useState<Order[]>([]);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) return;

        const loadOrders = async () => {
            // NOTE: Get seller's store first
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

            // NOTE: Get all orders for this store, joining product name
            const { data, error } = await supabase
                .from("orders")
                .select(
                    `
          *,
          products (
            name,
            image_url
          )
        `,
                )
                .eq("store_id", store.id)
                .order("created_at", { ascending: false });

            if (error) {
                setError(error.message);
            } else {
                setOrders(data || []);
            }

            setLoading(false);
        };

        loadOrders();
    }, [user]);

    const handleUpdatePaymentStatus = async (
        orderId: string,
        status: string,
    ) => {
        setUpdatingId(orderId);

        const { error } = await supabase
            .from("orders")
            .update({ payment_status: status })
            .eq("id", orderId);

        if (error) {
            setError(error.message);
            setUpdatingId(null);
            return;
        }

        // NOTE: Update local state without refetching
        setOrders((prev) =>
            prev.map((o) =>
                o.id === orderId ? { ...o, payment_status: status } : o,
            ),
        );

        if (selectedOrder?.id === orderId) {
            setSelectedOrder((prev) =>
                prev ? { ...prev, payment_status: status } : null,
            );
        }

        setUpdatingId(null);
    };

    const handleUpdateOrderStatus = async (orderId: string, status: string) => {
        setUpdatingId(orderId);

        const { error } = await supabase
            .from("orders")
            .update({ order_status: status })
            .eq("id", orderId);

        if (error) {
            setError(error.message);
            setUpdatingId(null);
            return;
        }

        setOrders((prev) =>
            prev.map((o) =>
                o.id === orderId ? { ...o, order_status: status } : o,
            ),
        );

        if (selectedOrder?.id === orderId) {
            setSelectedOrder((prev) =>
                prev ? { ...prev, order_status: status } : null,
            );
        }

        setUpdatingId(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-sm text-muted">Loading orders...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text">Orders</h1>
                <p className="text-sm text-muted mt-1">
                    {orders.length} total order{orders.length === 1 ? "" : "s"}
                </p>
            </div>

            {/* No store warning */}
            {!storeId && (
                <Card padding="lg" className="text-center">
                    <p className="text-sm font-medium text-text">
                        Set up your store first
                    </p>
                </Card>
            )}

            {/* Error */}
            {error && <p className="text-sm text-error">{error}</p>}

            {/* Empty state */}
            {storeId && orders.length === 0 && (
                <Card
                    padding="lg"
                    className="flex flex-col items-center text-center gap-3 py-12"
                >
                    <p className="text-lg font-semibold text-text">
                        No orders yet
                    </p>
                    <p className="text-sm text-muted max-w-sm">
                        Share your store link with customers to start receiving
                        orders.
                    </p>
                </Card>
            )}

            {/* Orders list */}
            {storeId && orders.length > 0 && (
                <div className="flex flex-col gap-3">
                    {orders.map((order) => (
                        <Card
                            key={order.id}
                            padding="md"
                            className="flex flex-col sm:flex-row sm:items-center gap-4"
                        >
                            {/* Product image */}
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-border shrink-0">
                                {order.products?.image_url ? (
                                    <img
                                        src={order.products.image_url}
                                        alt={order.products.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-border" />
                                )}
                            </div>

                            {/* Order details */}
                            <div className="flex-1 flex flex-col gap-1">
                                <p className="text-sm font-semibold text-text">
                                    {order.products?.name || "Product"}
                                </p>
                                <p className="text-xs text-muted">
                                    {order.customer_name} ·{" "}
                                    {order.customer_phone}
                                </p>
                                <p className="text-xs text-muted">
                                    Qty: {order.quantity} ·{" "}
                                    <span className="font-medium text-primary">
                                        ₦{order.total_price.toLocaleString()}
                                    </span>
                                </p>
                                <p className="text-xs text-muted">
                                    {new Date(
                                        order.created_at,
                                    ).toLocaleDateString("en-NG", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>

                            {/* Status badges */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    label={order.payment_status}
                                    variant={
                                        paymentStatusVariant(
                                            order.payment_status,
                                        ) as any
                                    }
                                />
                                <Badge
                                    label={orderStatusLabel(order.order_status)}
                                    variant={
                                        orderStatusVariant(
                                            order.order_status,
                                        ) as any
                                    }
                                />
                            </div>

                            {/* View details button */}
                            <button
                                onClick={() => setSelectedOrder(order)}
                                className={cn(
                                    "flex items-center gap-1.5 text-xs font-medium",
                                    "text-primary hover:text-primary-dark",
                                    "transition-colors duration-200 cursor-pointer shrink-0",
                                )}
                            >
                                <EyeIcon className="w-4 h-4" />
                                View
                            </button>
                        </Card>
                    ))}
                </div>
            )}

            {/* Order detail modal */}
            {selectedOrder && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
                    onClick={() => setSelectedOrder(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "w-full max-w-md bg-surface rounded-2xl",
                            "shadow-xl overflow-y-auto max-h-[90vh]",
                        )}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-base font-semibold text-text">
                                Order Details
                            </h2>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-muted hover:text-text cursor-pointer"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-6 py-4 flex flex-col gap-5">
                            {/* Product */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-border shrink-0">
                                    {selectedOrder.products?.image_url ? (
                                        <img
                                            src={
                                                selectedOrder.products.image_url
                                            }
                                            alt={selectedOrder.products.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-border" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-text">
                                        {selectedOrder.products?.name ||
                                            "Product"}
                                    </p>
                                    <p className="text-xs text-muted">
                                        Qty: {selectedOrder.quantity} · ₦
                                        {selectedOrder.total_price.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Customer details */}
                            <div className="flex flex-col gap-1.5">
                                <p className="text-xs font-semibold text-text uppercase tracking-wide">
                                    Customer
                                </p>
                                <p className="text-sm text-text">
                                    {selectedOrder.customer_name}
                                </p>
                                <p className="text-sm text-muted">
                                    {selectedOrder.customer_phone}
                                </p>
                                {selectedOrder.customer_email && (
                                    <p className="text-sm text-muted">
                                        {selectedOrder.customer_email}
                                    </p>
                                )}
                                <p className="text-sm text-muted">
                                    {selectedOrder.delivery_address}
                                </p>
                            </div>

                            {/* Payment details */}
                            <div className="flex flex-col gap-1.5">
                                <p className="text-xs font-semibold text-text uppercase tracking-wide">
                                    Payment
                                </p>
                                <p className="text-sm text-muted capitalize">
                                    {selectedOrder.payment_method.replace(
                                        "_",
                                        " ",
                                    )}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        label={selectedOrder.payment_status}
                                        variant={
                                            paymentStatusVariant(
                                                selectedOrder.payment_status,
                                            ) as any
                                        }
                                    />
                                    <Badge
                                        label={orderStatusLabel(
                                            selectedOrder.order_status,
                                        )}
                                        variant={
                                            orderStatusVariant(
                                                selectedOrder.order_status,
                                            ) as any
                                        }
                                    />
                                </div>
                            </div>

                            {/* Proof of payment */}
                            {selectedOrder.proof_of_payment_url && (
                                <div className="flex flex-col gap-1.5">
                                    <p className="text-xs font-semibold text-text uppercase tracking-wide">
                                        Proof of Payment
                                    </p>

                                    <a
                                        href={
                                            selectedOrder.proof_of_payment_url
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <img
                                            src={
                                                selectedOrder.proof_of_payment_url
                                            }
                                            alt="Proof of payment"
                                            className={cn(
                                                "w-full rounded-xl border border-border",
                                                "object-cover max-h-48",
                                                "hover:opacity-90 transition-opacity",
                                            )}
                                        />
                                    </a>
                                    <p className="text-xs text-muted">
                                        Click image to view full size
                                    </p>
                                </div>
                            )}

                            {/* Payment status actions */}
                            {selectedOrder.payment_status === "pending" && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs font-semibold text-text uppercase tracking-wide">
                                        Confirm Payment
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                handleUpdatePaymentStatus(
                                                    selectedOrder.id,
                                                    "paid",
                                                )
                                            }
                                            disabled={
                                                updatingId === selectedOrder.id
                                            }
                                            className={cn(
                                                "flex-1 py-2 rounded-lg text-sm font-medium",
                                                "bg-success text-white",
                                                "hover:opacity-90 transition-opacity cursor-pointer",
                                                "disabled:opacity-50",
                                            )}
                                        >
                                            ✓ Confirm Payment
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleUpdatePaymentStatus(
                                                    selectedOrder.id,
                                                    "failed",
                                                )
                                            }
                                            disabled={
                                                updatingId === selectedOrder.id
                                            }
                                            className={cn(
                                                "flex-1 py-2 rounded-lg text-sm font-medium",
                                                "bg-error text-white",
                                                "hover:opacity-90 transition-opacity cursor-pointer",
                                                "disabled:opacity-50",
                                            )}
                                        >
                                            ✕ Reject Payment
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Order status actions */}
                            {selectedOrder.payment_status === "paid" &&
                                selectedOrder.order_status !== "completed" &&
                                selectedOrder.order_status !== "cancelled" && (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs font-semibold text-text uppercase tracking-wide">
                                            Update Order Status
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                {
                                                    value: "confirmed",
                                                    label: "Confirmed",
                                                },
                                                {
                                                    value: "preparing",
                                                    label: "Preparing",
                                                },
                                                {
                                                    value: "out_for_delivery",
                                                    label: "Out for Delivery",
                                                },
                                                {
                                                    value: "completed",
                                                    label: "Completed",
                                                },
                                            ].map((status) => (
                                                <button
                                                    key={status.value}
                                                    onClick={() =>
                                                        handleUpdateOrderStatus(
                                                            selectedOrder.id,
                                                            status.value,
                                                        )
                                                    }
                                                    disabled={
                                                        updatingId ===
                                                            selectedOrder.id ||
                                                        selectedOrder.order_status ===
                                                            status.value
                                                    }
                                                    className={cn(
                                                        "py-2 px-3 rounded-lg text-xs font-medium",
                                                        "border-2 transition-colors duration-200 cursor-pointer",
                                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                                        selectedOrder.order_status ===
                                                            status.value
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "border-border hover:border-primary hover:text-primary",
                                                    )}
                                                >
                                                    {status.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Cancel order */}
                                        <button
                                            onClick={() =>
                                                handleUpdateOrderStatus(
                                                    selectedOrder.id,
                                                    "cancelled",
                                                )
                                            }
                                            disabled={
                                                updatingId === selectedOrder.id
                                            }
                                            className={cn(
                                                "py-2 rounded-lg text-xs font-medium",
                                                "text-error border-2 border-error/30",
                                                "hover:bg-error/10 transition-colors duration-200 cursor-pointer",
                                                "disabled:opacity-50",
                                            )}
                                        >
                                            Cancel Order
                                        </button>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
