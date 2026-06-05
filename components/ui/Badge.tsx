import { cn } from "@/lib/utils";

// Define the types for our Badge component
type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

// BadgeProps defines the props our Badge component accepts
interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    className?: string;
}

// This defines the styles for each badge variant
const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-[--color-border] text-[--color-text]",
    success: "bg-[--color-success]/10 text-[--color-success]",
    warning: "bg-[--color-accent]/10 text-[--color-accent]",
    error: "bg-[--color-error]/10 text-[--color-error]",
    info: "bg-[--color-primary]/10 text-[--color-primary]",
};

export default function Badge({
    label,
    variant = "default",
    className,
}: BadgeProps): React.ReactElement {
    return (
        <span
            className={cn(
                // Base styles for all badges
                "inline-flex items-center px-2.5 py-0.5",
                "rounded-full text-xs font-medium",
                variantStyles[variant],
                className,
            )}
        >
            {label}
        </span>
    );
}
