import { cn } from "@/lib/utils";

// InputProps extends standard HTML input attributes and adds our custom props
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    fullWidth?: boolean;
}

export default function Input({
    label,
    error,
    hint,
    fullWidth = true,
    className = "",
    id,
    ...props
}: InputProps): React.ReactElement {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
        <div className={cn("flex flex-col gap-1", fullWidth && "w-full")}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-text"
                >
                    {label}
                </label>
            )}

            <input
                id={inputId}
                // NOTE: We use cn to conditionally apply error styles and allow
                // additional custom styles via className prop without conflicts
                className={cn(
                    "w-full px-4 py-2.5 rounded-lg text-sm",
                    "bg-surface text-text",
                    "border border-border",
                    "placeholder:text-muted",
                    "outline-none transition-all duration-200",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    error &&
                        "border-error focus:border-error focus:ring-error/20",
                    className,
                )}
                {...props}
            />

            {hint && !error && <p className="text-xs text-muted">{hint}</p>}

            {error && <p className="text-xs text-error">{error}</p>}
        </div>
    );
}
