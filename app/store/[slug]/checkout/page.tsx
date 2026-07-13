"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { CartItem } from "@/context/CartContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
    ArrowLeftIcon,
    PhotoIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface Store {
    id: string;
    name: string;
    bank_name: string | null;
    account_number: string | null;
    account_name: string | null;
}

type PaymentMethod = "bank_transfer" | "card";

export default function CheckoutPage(): React.ReactElement {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { items, totalPrice, clearCart } = useCart();

    // Store state
    const [store, setStore] = useState<Store | null>(null);
    const [storeLoading, setStoreLoading] = useState(true);

    // Form state
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>("bank_transfer");
    const [proofOfPayment, setProofOfPayment] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [uploadingProof, setUploadingProof] = useState(false);

    useEffect(() => {
        if (!slug) return;

        const loadStore = async () => {
            const { data } = await supabase
                .from("stores")
                .select("id, name, bank_name, account_number, account_name")
                .eq("slug", slug)
                .eq("is_active", true)
                .single();

            setStore(data || null);
            setStoreLoading(false);
        };

        loadStore();
    }, [slug]);

    // NOTE: Redirect back to store if cart is empty
    useEffect(() => {
        if (!storeLoading && items.length === 0) {
            router.push(`/store/${slug}`);
        }
    }, [items, storeLoading, slug, router]);

    const handleProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // NOTE: Validate file type and size (max 5MB for proof of payment)
        const validTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
        ];
        if (!validTypes.includes(file.type)) {
            setError("Please upload a JPG, PNG or WebP image");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Proof of payment must be under 5MB");
            return;
        }

        setProofOfPayment(file);
        setProofPreview(URL.createObjectURL(file));
        setError("");
        e.target.value = "";
    };

    const handleRemoveProof = () => {
        if (proofPreview) URL.revokeObjectURL(proofPreview);
        setProofOfPayment(null);
        setProofPreview(null);
    };

    const uploadProof = async (orderId: string): Promise<string> => {
        if (!proofOfPayment) return "";

        const filePath = `proof/${orderId}/${Date.now()}`;

        const { error } = await supabase.storage
            .from("product-images")
            .upload(filePath, proofOfPayment, { upsert: true });

        if (error) throw new Error(`Failed to upload proof: ${error.message}`);

        const { data } = supabase.storage
            .from("product-images")
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // NOTE: Validate required fields
        if (!customerName || !customerPhone || !deliveryAddress) {
            setError(
                "Please fill in your name, phone number and delivery address",
            );
            return;
        }

        if (customerPhone.length < 10) {
            setError("Please enter a valid phone number");
            return;
        }

        if (paymentMethod === "bank_transfer" && !proofOfPayment) {
            setError(
                "Please upload your proof of payment before placing the order",
            );
            return;
        }

        if (!store) {
            setError("Store not found");
            return;
        }

        setLoading(true);

        try {
            // NOTE: Create one order per cart item
            // This keeps the orders table simple and each order
            // maps to exactly one product
            for (const item of items) {
                // NOTE: Upload proof of payment first if bank transfer
                let proofUrl = "";
                if (paymentMethod === "bank_transfer" && proofOfPayment) {
                    setUploadingProof(true);
                    proofUrl = await uploadProof(`${store.id}-${Date.now()}`);
                    setUploadingProof(false);
                }

                const { error: orderError } = await supabase
                    .from("orders")
                    .insert({
                        store_id: store.id,
                        product_id: item.id,
                        customer_name: customerName,
                        customer_phone: customerPhone,
                        customer_email: customerEmail || null,
                        delivery_address: deliveryAddress,
                        quantity: item.quantity,
                        // NOTE: Store price snapshot at time of order
                        unit_price: item.price,
                        total_price: item.price * item.quantity,
                        payment_method: paymentMethod,
                        payment_status: "pending",
                        order_status: "pending",
                        proof_of_payment_url: proofUrl || null,
                    });

                if (orderError) throw new Error(orderError.message);
            }

            // NOTE: Clear the cart and redirect to success page
            clearCart();
            router.push(`/store/${slug}/checkout/success`);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong",
            );
            setLoading(false);
        }
    };

    if (storeLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-sm text-muted">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-surface border-b border-border">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
                    <Link href={`/store/${slug}`}>
                        <button className="text-muted hover:text-text cursor-pointer">
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                    </Link>
                    <h1 className="text-base font-semibold text-text">
                        Checkout
                    </h1>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
                {/* Order summary */}
                <div
                    className={cn(
                        "bg-surface rounded-2xl border border-border p-4",
                        "flex flex-col gap-3",
                    )}
                >
                    <h2 className="text-sm font-semibold text-text">
                        Order Summary
                    </h2>
                    {items.map((item: CartItem) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between gap-3"
                        >
                            <div className="flex items-center gap-3">
                                {item.image_url ? (
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="w-10 h-10 rounded-lg object-cover border border-border"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-border" />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-text">
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-muted">
                                        Qty: {item.quantity}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-text shrink-0">
                                ₦{(item.price * item.quantity).toLocaleString()}
                            </p>
                        </div>
                    ))}

                    <div className="border-t border-border pt-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-text">Total</p>
                        <p className="text-base font-bold text-primary">
                            ₦{totalPrice.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Checkout form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Delivery details */}
                    <div
                        className={cn(
                            "bg-surface rounded-2xl border border-border p-4",
                            "flex flex-col gap-4",
                        )}
                    >
                        <h2 className="text-sm font-semibold text-text">
                            Delivery Details
                        </h2>

                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="Jane Doe"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />

                        <Input
                            label="Phone Number"
                            type="tel"
                            placeholder="08012345678"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                        />

                        <Input
                            label="Email Address (optional)"
                            type="email"
                            placeholder="you@example.com"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            hint="We'll send your receipt here if provided"
                        />

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-text">
                                Delivery Address
                            </label>
                            <textarea
                                placeholder="Enter your full delivery address..."
                                value={deliveryAddress}
                                onChange={(e) =>
                                    setDeliveryAddress(e.target.value)
                                }
                                rows={3}
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
                    </div>

                    {/* Payment method */}
                    <div
                        className={cn(
                            "bg-surface rounded-2xl border border-border p-4",
                            "flex flex-col gap-4",
                        )}
                    >
                        <h2 className="text-sm font-semibold text-text">
                            Payment Method
                        </h2>

                        {/* Bank transfer option */}
                        <button
                            type="button"
                            onClick={() => setPaymentMethod("bank_transfer")}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border-2",
                                "transition-colors duration-200 cursor-pointer text-left",
                                paymentMethod === "bank_transfer"
                                    ? "border-primary bg-primary/5"
                                    : "border-border",
                            )}
                        >
                            <div
                                className={cn(
                                    "w-4 h-4 rounded-full border-2 shrink-0",
                                    "flex items-center justify-center",
                                    paymentMethod === "bank_transfer"
                                        ? "border-primary"
                                        : "border-muted",
                                )}
                            >
                                {paymentMethod === "bank_transfer" && (
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text">
                                    Bank Transfer
                                </p>
                                <p className="text-xs text-muted">
                                    Transfer to the seller's account and upload
                                    proof
                                </p>
                            </div>
                        </button>

                        {/* Bank transfer details */}
                        {paymentMethod === "bank_transfer" &&
                            store?.bank_name && (
                                <div
                                    className={cn(
                                        "p-3 rounded-xl bg-primary/5 border border-primary/20",
                                        "flex flex-col gap-1.5",
                                    )}
                                >
                                    <p className="text-xs font-semibold text-text">
                                        Transfer to:
                                    </p>
                                    <p className="text-sm font-bold text-text">
                                        {store.account_name}
                                    </p>
                                    <p className="text-sm text-text">
                                        {store.account_number}
                                    </p>
                                    <p className="text-xs text-muted">
                                        {store.bank_name}
                                    </p>
                                    <p className="text-xs text-muted mt-1">
                                        After transferring, upload your payment
                                        screenshot below.
                                    </p>
                                </div>
                            )}

                        {/* No bank details warning */}
                        {paymentMethod === "bank_transfer" &&
                            !store?.bank_name && (
                                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                                    <p className="text-xs text-accent">
                                        This seller hasn't set up their payment
                                        details yet. Please contact them
                                        directly.
                                    </p>
                                </div>
                            )}

                        {/* Proof of payment upload */}
                        {paymentMethod === "bank_transfer" &&
                            store?.bank_name && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-text">
                                        Upload Proof of Payment
                                    </label>

                                    {proofPreview ? (
                                        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border">
                                            <img
                                                src={proofPreview}
                                                alt="Proof of payment"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveProof}
                                                className={cn(
                                                    "absolute top-2 right-2",
                                                    "bg-black/50 rounded-full p-1",
                                                    "text-white cursor-pointer",
                                                )}
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-2",
                                                "w-full h-32 rounded-xl",
                                                "border-2 border-dashed border-border",
                                                "cursor-pointer transition-colors duration-200",
                                                "hover:border-primary hover:bg-primary/5",
                                            )}
                                        >
                                            <PhotoIcon className="w-8 h-8 text-muted" />
                                            <p className="text-sm text-muted">
                                                Upload payment screenshot
                                            </p>
                                            <p className="text-xs text-muted">
                                                JPG, PNG or WebP — max 5MB
                                            </p>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={handleProofSelect}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            )}
                    </div>

                    {error && <p className="text-sm text-error">{error}</p>}

                    <Button type="submit" fullWidth loading={loading}>
                        {uploadingProof
                            ? "Uploading proof..."
                            : loading
                              ? "Placing order..."
                              : `Place Order — ₦${totalPrice.toLocaleString()}`}
                    </Button>
                </form>

                {/* Vendmint branding */}
                <p className="text-xs text-muted text-center pb-6">
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
