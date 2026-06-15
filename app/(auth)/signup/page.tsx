"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export default function SignupPage(): React.ReactElement {
    const router = useRouter();

    // Form state
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // NOTE: Basic client side validation before hitting Supabase
        if (!fullName || !email || !password || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        // NOTE: Supabase handles the signup, hashing the password
        // and sending a verification email automatically
        const { error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        setLoading(false);

        if (signupError) {
            setError(signupError.message);
            return;
        }

        // NOTE: Redirect to dashboard after successful signup
        router.push("/dashboard");
    };

    return (
        <div
            className={cn(
                "w-full max-w-md",
                "bg-surface",
                "rounded-2xl shadow-sm",
                "border border-border",
                "p-8",
            )}
        >
            {/* Header */}
            <div className="mb-8">
                <Link href="/" className="text-xl font-bold text-primary">
                    Vendmint
                </Link>
                <h1 className="text-2xl font-bold text-text mt-4">
                    Create your account
                </h1>
                <p className="text-sm text-muted mt-1">
                    Start selling online in minutes
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <Input
                    label="Full Name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                />
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
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                {/* NOTE: Error message shown when signup fails */}
                {error && <p className="text-sm text-error">{error}</p>}

                <Button
                    type="submit"
                    fullWidth
                    loading={loading}
                    className="mt-2"
                >
                    Create Account
                </Button>
            </form>

            {/* Footer link */}
            <p className="text-sm text-muted text-center mt-6">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="text-primary font-medium hover:underline"
                >
                    Login
                </Link>
            </p>
        </div>
    );
}
