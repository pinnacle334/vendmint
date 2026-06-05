import { cn } from "@/lib/utils";

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
}: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
        <div className={`flex flex-col gap-1 ${fullWidth ? "w-full" : ""}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-[--color-text]"
                >
                    {label}
                </label>
            )}

            <input
                id={inputId}
                // NOTE: We use cn here to conditionally apply error styles and to allow for additional custom styles via the className prop without conflicts.
                className={cn(
                    "w-full px-4 py-2.5 rounded-lg text-sm",
                    "bg-[--color-surface] text-[--color-text]",
                    "border border-[--color-border]",
                    "placeholder:text-[--color-muted]",
                    "outline-none transition-all duration-200",
                    "focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary]/20",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    error &&
                        "border-[--color-error] focus:border-[--color-error] focus:ring-[--color-error]/20",
                    className,
                )}
                {...props}
            />

            {hint && !error && (
                <p className="text-xs text-[--color-muted]">{hint}</p>
            )}

            {error && <p className="text-xs text-[--color-error]">{error}</p>}
        </div>
    );
}
