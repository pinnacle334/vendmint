"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function LoginPage(): React.ReactElement {
    const router = useRouter();

    // Form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // NOTE: Basic client side validation before hitting Supabase
        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);

        // NOTE: Supabase handles the login and sets the session
        // automatically in the browser cookies
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        setLoading(false);

        if (loginError) {
            setError(loginError.message);
            return;
        }

        // NOTE: Redirect to dashboard after successful login
        router.push("/dashboard");
    };

    return (
        <div className="w-full max-w-md">
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-linear-to-r from-primary to-accent rounded-t-2xl" />

            <div
                className={cn(
                    "w-full bg-surface",
                    "rounded-b-2xl shadow-sm",
                    "px-8 py-10",
                )}
            >
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-8">
                    <Link
                        href="/"
                        className="text-2xl font-black tracking-tight"
                    >
                        <span className="text-primary">Vend</span>
                        <span className="text-accent">mint</span>
                    </Link>

                    {/* Decorative dot */}
                    <div className="flex items-center gap-1.5 mt-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <div className="w-6 h-1.5 rounded-full bg-primary" />
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    </div>

                    <h1 className="text-2xl font-bold text-text mt-4">
                        Welcome back 👋
                    </h1>
                    <p className="text-sm text-muted mt-1">
                        Login to manage your store
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {/* Forgot password link */}
                    <div className="flex justify-end -mt-2">
                        <Link
                            href="/forgot-password"
                            className={cn(
                                "text-xs text-muted",
                                "hover:text-primary transition-colors duration-200",
                            )}
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {/* Error message */}
                    {error && <p className="text-sm text-error">{error}</p>}

                    <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        className="mt-2"
                    >
                        Login
                    </Button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted">or</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                {/* Footer link */}
                <p className="text-sm text-muted text-center">
                    Don't have an account?{" "}
                    <Link
                        href="/signup"
                        className={cn(
                            "text-primary font-semibold",
                            "hover:text-accent transition-colors duration-200",
                        )}
                    >
                        Create one free →
                    </Link>
                </p>
            </div>
        </div>
    );
}
