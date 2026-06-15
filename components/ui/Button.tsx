import { cn } from "@/lib/utils";

// Here we define the types for our Button component, including the variants and sizes it can have, as well as the props it accepts.
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

// The ButtonProps interface extends the standard HTML button attributes (e.g., onClick, disabled), and adds our custom props for variant, size, loading state, and full width option.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
}

// This defines the styles for each button variant, using Tailwind CSS classes.
const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-primary hover:bg-primary-dark text-white",
    secondary: "bg-surface hover:bg-border text-text",
    outline:
        "border border-primary text-primary hover:bg-primary hover:text-white",
    ghost: "text-text hover:bg-border",
    danger: "bg-error hover:opacity-90 text-white",
};

// This defines the styles for each button size, using Tailwind CSS classes.
const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
};

export default function Button({
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    children,
    className = "",
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            // NOTE: We use cn here to conditionally apply variant and size styles based on props and to allow for additional custom styles via the className prop without conflicts.
            className={cn(
                "inline-flex items-center justify-center gap-2",
                "rounded-lg font-medium transition-all duration-200",
                "cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                variantStyles[variant],
                sizeStyles[size],
                fullWidth && "w-full",
                className,
            )}
            {...props}
        >
            {loading ? (
                <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                </>
            ) : (
                children
            )}
        </button>
    );
}
