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
        <div
            className={cn(
                "w-full max-w-md",
                "bg-[--color-surface]",
                "rounded-2xl shadow-sm",
                "border border-[--color-border]",
                "p-8",
            )}
        >
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/"
                    className="text-xl font-bold text-[--color-primary]"
                >
                    Vendmint
                </Link>
                <h1 className="text-2xl font-bold text-[--color-text] mt-4">
                    Welcome back
                </h1>
                <p className="text-sm text-[--color-muted] mt-1">
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
                            "text-xs text-[--color-muted]",
                            "hover:text-[--color-primary] transition-colors duration-200",
                        )}
                    >
                        Forgot password?
                    </Link>
                </div>

                {/* NOTE: Error message shown when login fails */}
                {error && (
                    <p className="text-sm text-[--color-error]">{error}</p>
                )}

                <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    className="mt-2"
                >
                    Login
                </Button>
            </form>

            {/* Footer link */}
            <p className="text-sm text-[--color-muted] text-center mt-6">
                Don't have an account?{" "}
                <Link
                    href="/signup"
                    className="text-[--color-primary] font-medium hover:underline"
                >
                    Create one free
                </Link>
            </p>
        </div>
    );
}
