"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import imageCompression from "browser-image-compression";

const FREE_PRODUCT_LIMIT = 6;
const PRO_PRODUCT_LIMIT = 50;
const FREE_IMAGE_LIMIT = 1;
const PRO_IMAGE_LIMIT = 5;
const MAX_FILE_SIZE_MB = 1;

export default function NewProductPage(): React.ReactElement {
    const { user } = useAuth();
    const { effectivePlan } = usePlan();
    const router = useRouter();

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
    const [isAvailable, setIsAvailable] = useState(true);

    // Image state
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    // UI state
    const [storeId, setStoreId] = useState<string | null>(null);
    const [productCount, setProductCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState("");

    // NOTE: Determine limits based on plan
    const productLimit =
        effectivePlan === "pro" ? PRO_PRODUCT_LIMIT : FREE_PRODUCT_LIMIT;
    const imageLimit =
        effectivePlan === "pro" ? PRO_IMAGE_LIMIT : FREE_IMAGE_LIMIT;

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            // NOTE: Get seller's store
            const { data: store } = await supabase
                .from("stores")
                .select("id")
                .eq("owner_id", user.id)
                .single();

            if (!store) {
                setPageLoading(false);
                return;
            }

            setStoreId(store.id);

            // NOTE: Get current product count to enforce limit
            const { count } = await supabase
                .from("products")
                .select("id", { count: "exact", head: true })
                .eq("store_id", store.id);

            setProductCount(count || 0);
            setPageLoading(false);
        };

        loadData();
    }, [user]);

    const handleImageSelect = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        // NOTE: Enforce image limit per plan
        const remainingSlots = imageLimit - images.length;
        const filesToAdd = files.slice(0, remainingSlots);

        if (files.length > remainingSlots) {
            setError(
                `You can only upload ${imageLimit} image${imageLimit === 1 ? "" : "s"} on your current plan.`,
            );
        }

        setUploadingImages(true);
        const compressedFiles: File[] = [];
        const previews: string[] = [];

        for (const file of filesToAdd) {
            // NOTE: Validate file size before compression
            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024 * 5) {
                setError(
                    `${file.name} is too large. Please choose a smaller image.`,
                );
                continue;
            }

            try {
                // NOTE: Compress the image client-side before upload
                // This ensures fast uploads and stays within storage limits
                const compressed = await imageCompression(file, {
                    maxSizeMB: MAX_FILE_SIZE_MB,
                    maxWidthOrHeight: 1200,
                    useWebWorker: true,
                });

                compressedFiles.push(compressed as File);

                // NOTE: Generate preview URL for the compressed image
                const preview = URL.createObjectURL(compressed);
                previews.push(preview);
            } catch {
                setError(
                    `Failed to process ${file.name}. Please try another image.`,
                );
            }
        }

        setImages((prev) => [...prev, ...compressedFiles]);
        setImagePreviews((prev) => [...prev, ...previews]);
        setUploadingImages(false);

        // NOTE: Reset the input so the same file can be selected again if needed
        e.target.value = "";
    };

    const handleRemoveImage = (index: number) => {
        // NOTE: Revoke the object URL to free browser memory
        URL.revokeObjectURL(imagePreviews[index]);
        setImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async (productId: string): Promise<string[]> => {
        const uploadedUrls: string[] = [];

        for (let i = 0; i < images.length; i++) {
            const file = images[i];
            // NOTE: Use a unique path per product and image index
            const filePath = `${user?.id}/${productId}/${i}_${Date.now()}`;

            const { error } = await supabase.storage
                .from("product-images")
                .upload(filePath, file, { upsert: true });

            if (error) {
                throw new Error(`Failed to upload image: ${error.message}`);
            }

            // NOTE: Get the public URL for the uploaded image
            const { data } = supabase.storage
                .from("product-images")
                .getPublicUrl(filePath);

            uploadedUrls.push(data.publicUrl);
        }

        return uploadedUrls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name || !price) {
            setError("Product name and price are required");
            return;
        }

        if (isNaN(Number(price)) || Number(price) <= 0) {
            setError("Please enter a valid price");
            return;
        }

        if (!storeId) {
            setError("Please set up your store before adding products");
            return;
        }

        // NOTE: Enforce product limit at submission time, not just UI level
        // This is our client-side enforcement of the plan limit
        if (productCount >= productLimit) {
            setError(
                `You have reached your ${effectivePlan === "free" ? "Free" : "Pro"} plan product limit of ${productLimit}.`,
            );
            return;
        }

        setLoading(true);

        try {
            // NOTE: Insert the product first to get its ID for the image path
            const { data: product, error: insertError } = await supabase
                .from("products")
                .insert({
                    store_id: storeId,
                    name,
                    description: description || null,
                    price: Number(price),
                    category: category || null,
                    is_available: isAvailable,
                    image_url: null, // NOTE: Will be updated after image upload
                })
                .select()
                .single();

            if (insertError) throw new Error(insertError.message);

            // NOTE: Upload images if any were selected
            if (images.length > 0) {
                const imageUrls = await uploadImages(product.id);

                // NOTE: Store the first image as the primary image_url
                // Multiple image support can be added to a separate table later
                await supabase
                    .from("products")
                    .update({ image_url: imageUrls[0] })
                    .eq("id", product.id);
            }

            router.push("/dashboard/products");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong",
            );
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-sm text-muted">Loading...</p>
            </div>
        );
    }

    // NOTE: Block access entirely if product limit already reached
    if (productCount >= productLimit) {
        return (
            <div className="flex flex-col gap-6 max-w-2xl">
                <h1 className="text-2xl font-bold text-text">Add Product</h1>
                <div
                    className={cn(
                        "bg-surface border border-border rounded-2xl p-6",
                        "flex flex-col items-center text-center gap-3",
                    )}
                >
                    <p className="text-lg font-semibold text-text">
                        Product limit reached
                    </p>
                    <p className="text-sm text-muted max-w-sm">
                        You have reached your{" "}
                        {effectivePlan === "free" ? "Free" : "Pro"} plan limit
                        of {productLimit} products.
                        {effectivePlan === "free" &&
                            " Upgrade to Pro to add up to 50 products."}
                    </p>
                    {effectivePlan === "free" && (
                        <Button
                            variant="outline"
                            onClick={() => router.push("/dashboard/settings")}
                        >
                            Upgrade to Pro
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard/products")}
                    >
                        Back to Products
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text">Add Product</h1>
                <p className="text-sm text-muted mt-1">
                    Fill in the details below to add a new product to your
                    store.
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
                {/* Product name */}
                <Input
                    label="Product Name"
                    type="text"
                    placeholder="e.g. Chocolate Cake"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                {/* Price */}
                <Input
                    label="Price (₦)"
                    type="number"
                    placeholder="e.g. 5000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="1"
                />

                {/* Category */}
                <Input
                    label="Category (optional)"
                    type="text"
                    placeholder="e.g. Cakes, Pastries, Drinks"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                />

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text">
                        Description (optional)
                    </label>
                    <textarea
                        placeholder="Describe your product..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
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

                {/* Image upload */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-text">
                            Product Image{imageLimit > 1 ? "s" : ""}
                        </label>
                        <span className="text-xs text-muted">
                            {images.length}/{imageLimit} image
                            {imageLimit === 1 ? "" : "s"}
                        </span>
                    </div>

                    {/* Image previews */}
                    {imagePreviews.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            {imagePreviews.map((preview, index) => (
                                <div
                                    key={index}
                                    className="relative w-24 h-24 rounded-lg overflow-hidden border border-border"
                                >
                                    <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(index)}
                                        className={cn(
                                            "absolute top-1 right-1",
                                            "bg-black/50 rounded-full p-0.5",
                                            "text-white cursor-pointer",
                                        )}
                                    >
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upload button - hidden when limit reached */}
                    {images.length < imageLimit && (
                        <label
                            className={cn(
                                "flex flex-col items-center justify-center gap-2",
                                "w-full h-32 rounded-lg",
                                "border-2 border-dashed border-border",
                                "cursor-pointer transition-colors duration-200",
                                "hover:border-primary hover:bg-primary/5",
                                uploadingImages &&
                                    "opacity-50 cursor-not-allowed",
                            )}
                        >
                            <PhotoIcon className="w-8 h-8 text-muted" />
                            <p className="text-sm text-muted">
                                {uploadingImages
                                    ? "Processing image..."
                                    : "Click to upload image"}
                            </p>
                            <p className="text-xs text-muted">
                                JPEG, PNG or WebP — max 1MB
                            </p>
                            <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                multiple={imageLimit > 1}
                                onChange={handleImageSelect}
                                disabled={uploadingImages}
                                className="hidden"
                            />
                        </label>
                    )}

                    {/* Pro upgrade nudge for free sellers */}
                    {effectivePlan === "free" && (
                        <p className="text-xs text-muted">
                            Free plan: 1 image per product.{" "}
                            <span className="text-accent font-medium">
                                Upgrade to Pro
                            </span>{" "}
                            for up to 5 images.
                        </p>
                    )}
                </div>

                {/* Availability toggle */}
                {/* Availability toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-text">
                            Available for sale
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                            Customers can only order available products
                        </p>
                    </div>
       {/* Availability toggle */}
<div className="flex items-center justify-between">
  <div>
    <p className="text-sm font-medium text-text">Available for sale</p>
    <p className="text-xs text-muted mt-0.5">
      Customers can only order available products
    </p>
  </div>
  <button
    type="button"
    onClick={() => setIsAvailable((prev) => !prev)}
    className={cn(
      "w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer",
      "flex items-center px-1 border-2",
      isAvailable
        ? "bg-primary border-primary justify-end"
        : "bg-transparent border-border justify-start",
    )}
  >
    <span
      className={cn(
        "w-4 h-4 rounded-full shadow-sm transition-colors duration-200",
        isAvailable ? "bg-white" : "bg-border",
      )}
    />
  </button>
</div>
                </div>

                {/* Error message */}
                {error && <p className="text-sm text-error">{error}</p>}

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Button type="submit" loading={loading}>
                        Add Product
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.push("/dashboard/products")}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
