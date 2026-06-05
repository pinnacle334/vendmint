"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

// Define the types for our Modal component
type ModalSize = "sm" | "md" | "lg" | "full";

// ModalProps defines the props our Modal component accepts
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: ModalSize;
    closeOnOverlayClick?: boolean;
    className?: string;
}

// This defines the styles for each modal size
const sizeStyles: Record<ModalSize, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    full: "max-w-full mx-4",
};

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = "md",
    closeOnOverlayClick = true,
    className,
}: ModalProps): React.ReactElement {
    // NOTE: This effect prevents background scrolling when the modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // NOTE: This effect closes the modal when the Escape key is pressed
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    // Don't render anything if modal is closed
    if (!isOpen) return <></>;

    return (
        // Overlay
        <div
            className={cn(
                "fixed inset-0 z-50",
                "flex items-center justify-center",
                "bg-black/50 backdrop-blur-sm",
                "px-4",
            )}
            onClick={closeOnOverlayClick ? onClose : undefined}
        >
            {/* Modal card */}
            <div
                // NOTE: stopPropagation prevents the overlay click from closing
                // the modal when clicking inside the modal card itself
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    "relative w-full bg-[--color-surface]",
                    "rounded-2xl shadow-xl",
                    "flex flex-col",
                    sizeStyles[size],
                    className,
                )}
            >
                {/* Header */}
                {title && (
                    <div
                        className={cn(
                            "flex items-center justify-between",
                            "px-6 py-4 border-b border-[--color-border]",
                        )}
                    >
                        <h2 className="text-base font-semibold text-[--color-text]">
                            {title}
                        </h2>
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className={cn(
                                "text-[--color-muted] hover:text-[--color-text]",
                                "transition-colors duration-200 cursor-pointer",
                            )}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="px-6 py-4">{children}</div>
            </div>
        </div>
    );
}
