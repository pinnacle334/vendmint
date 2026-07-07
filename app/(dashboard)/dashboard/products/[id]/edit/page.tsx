"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import imageCompression from "browser-image-compression";

const FREE_IMAGE_LIMIT = 1;
const PRO_IMAGE_LIMIT = 5;
const MAX_FILE_SIZE_MB = 1;

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    is_available: boolean;
    category: string | null;
    store_id: string;
}

export default function EditProductPage(): React.ReactElement {
    const { user } = useAuth();
    const { effectivePlan } = usePlan();
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("");
    const [isAvailable, setIsAvailable] = useState(true);

    // Image state
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
        null,
    );
    const [newImages, setNewImages] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
    const [removeExistingImage, setRemoveExistingImage] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);

    // UI state
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState("");

    // NOTE: Determine image limit based on plan
    const imageLimit =
        effectivePlan === "pro" ? PRO_IMAGE_LIMIT : FREE_IMAGE_LIMIT;

    useEffect(() => {
        if (!user || !productId) return;

        const loadProduct = async () => {
            const { data: product, error } = await supabase
                .from("products")
                .select("*")
                .eq("id", productId)
                .single();

            if (error || !product) {
                setError("Product not found");
                setPageLoading(false);
                return;
            }

            // NOTE: Pre-fill form with existing product data
            setName(product.name);
            setDescription(product.description || "");
            setPrice(String(product.price));
            setCategory(product.category || "");
            setIsAvailable(product.is_available);
            setExistingImageUrl(product.image_url);
            setPageLoading(false);
        };

        loadProduct();
    }, [user, productId]);

    const handleImageSelect = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        // NOTE: Calculate remaining image slots accounting for
        // existing image and newly added images
        const existingCount = existingImageUrl && !removeExistingImage ? 1 : 0;
        const remainingSlots = imageLimit - existingCount - newImages.length;
        const filesToAdd = files.slice(0, remainingSlots);

        if (files.length > remainingSlots) {
            setError(
                `You can only have ${imageLimit} image${imageLimit === 1 ? "" : "s"} on your current plan.`,
            );
        }

        setUploadingImages(true);
        const compressedFiles: File[] = [];
        const previews: string[] = [];

        for (const file of filesToAdd) {
            try {
                const compressed = await imageCompression(file, {
                    maxSizeMB: MAX_FILE_SIZE_MB,
                    maxWidthOrHeight: 1200,
                    useWebWorker: true,
                });

                compressedFiles.push(compressed as File);
                previews.push(URL.createObjectURL(compressed));
            } catch {
                setError(
                    `Failed to process ${file.name}. Please try another image.`,
                );
            }
        }

        setNewImages((prev) => [...prev, ...compressedFiles]);
        setNewImagePreviews((prev) => [...prev, ...previews]);
        setUploadingImages(false);
        e.target.value = "";
    };

    const handleRemoveNewImage = (index: number) => {
        URL.revokeObjectURL(newImagePreviews[index]);
        setNewImages((prev) => prev.filter((_, i) => i !== index));
        setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
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

        setLoading(true);

        try {
            let imageUrl = removeExistingImage ? null : existingImageUrl;

            // NOTE: Upload new images if any were added
            if (newImages.length > 0) {
                for (let i = 0; i < newImages.length; i++) {
                    const file = newImages[i];
                    const filePath = `${user?.id}/${productId}/${i}_${Date.now()}`;

                    const { error: uploadError } = await supabase.storage
                        .from("product-images")
                        .upload(filePath, file, { upsert: true });

                    if (uploadError) throw new Error(uploadError.message);

                    const { data } = supabase.storage
                        .from("product-images")
                        .getPublicUrl(filePath);

                    // NOTE: Use first new image as primary if existing was removed
                    if (i === 0) imageUrl = data.publicUrl;
                }
            }

            const { error: updateError } = await supabase
                .from("products")
                .update({
                    name,
                    description: description || null,
                    price: Number(price),
                    category: category || null,
                    is_available: isAvailable,
                    image_url: imageUrl,
                })
                .eq("id", productId);

            if (updateError) throw new Error(updateError.message);

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
                <p className="text-sm text-muted">Loading product...</p>
            </div>
        );
    }

    // NOTE: Calculate how many more images can be added
    const existingCount = existingImageUrl && !removeExistingImage ? 1 : 0;
    const totalImages = existingCount + newImages.length;
    const canAddMoreImages = totalImages < imageLimit;

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text">Edit Product</h1>
                <p className="text-sm text-muted mt-1">
                    Update your product details below.
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
                    label="Product Name"
                    type="text"
                    placeholder="e.g. Chocolate Cake"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <Input
                    label="Price (₦)"
                    type="number"
                    placeholder="e.g. 5000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="1"
                />

                <Input
                    label="Category (optional)"
                    type="text"
                    placeholder="e.g. Cakes, Pastries, Drinks"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                />

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

                {/* Image management */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-text">
                            Product Image{imageLimit > 1 ? "s" : ""}
                        </label>
                        <span className="text-xs text-muted">
                            {totalImages}/{imageLimit}
                        </span>
                    </div>

                    {/* Existing image */}
                    {existingImageUrl && !removeExistingImage && (
                        <div className="flex items-center gap-3">
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                                <img
                                    src={existingImageUrl}
                                    alt="Current product image"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setRemoveExistingImage(true)}
                                    className={cn(
                                        "absolute top-1 right-1",
                                        "bg-black/50 rounded-full p-0.5",
                                        "text-white cursor-pointer",
                                    )}
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </div>
                            <p className="text-xs text-muted">Current image</p>
                        </div>
                    )}

                    {/* Removed image notice */}
                    {existingImageUrl && removeExistingImage && (
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-error">
                                Current image will be removed on save.
                            </p>
                            <button
                                type="button"
                                onClick={() => setRemoveExistingImage(false)}
                                className="text-xs text-primary underline cursor-pointer"
                            >
                                Undo
                            </button>
                        </div>
                    )}

                    {/* New image previews */}
                    {newImagePreviews.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            {newImagePreviews.map((preview, index) => (
                                <div
                                    key={index}
                                    className="relative w-24 h-24 rounded-lg overflow-hidden border border-border"
                                >
                                    <img
                                        src={preview}
                                        alt={`New image ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRemoveNewImage(index)
                                        }
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

                    {/* Upload area */}
                    {canAddMoreImages && (
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
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-text">
                            Available for sale
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                            Customers can only order available products
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsAvailable((prev) => !prev)}
                        className={cn(
                            "w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer",
                            "relative shrink-0",
                            isAvailable ? "bg-primary" : "bg-border",
                        )}
                    >
                        <span
                            className={cn(
                                "absolute top-0.5 w-5 h-5 rounded-full bg-white",
                                "transition-transform duration-200 shadow-sm",
                                isAvailable
                                    ? "translate-x-5"
                                    : "translate-x-0.5",
                            )}
                        />
                    </button>
                </div>

                {error && <p className="text-sm text-error">{error}</p>}

                <div className="flex items-center gap-3">
                    <Button type="submit" loading={loading}>
                        Save Changes
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
