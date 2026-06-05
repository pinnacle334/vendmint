import { cn } from "@/lib/utils";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: "none" | "sm" | "md" | "lg";
    hoverable?: boolean;
    onClick?: () => void;
}

const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-7",
};

export default function Card({
    children,
    className = "",
    padding = "md",
    hoverable = false,
    onClick,
}: CardProps) {
    return (
        <div
            onClick={onClick}
            // NOTE: We use cn here to conditionally apply hover styles and padding based on props and to allow for additional custom styles via the className prop without conflicts.
            className={cn(
                "bg-[--color-surface] rounded-xl",
                "border border-[--color-border]",
                "shadow-sm",
                paddingStyles[padding],
                hoverable &&
                    "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[--color-primary]",
                className,
            )}
        >
            {children}
        </div>
    );
}
