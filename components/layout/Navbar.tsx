"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function Navbar(): React.ReactElement {
    // NOTE: Controls mobile menu open/close state
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header
            className={cn(
                "w-full bg-[--color-surface]",
                "border-b border-[--color-border]",
                "sticky top-0 z-40",
            )}
        >
            <div
                className={cn(
                    "max-w-6xl mx-auto px-4",
                    "h-16 flex items-center justify-between",
                )}
            >
                {/* Logo */}
                <Link
                    href="/"
                    className="text-xl font-bold text-[--color-primary]"
                >
                    Vendmint
                </Link>

                {/* Desktop nav links */}
                <nav className="hidden md:flex items-center gap-6">
                    <Link
                        href="#features"
                        className={cn(
                            "text-sm text-[--color-muted]",
                            "hover:text-[--color-text] transition-colors duration-200",
                        )}
                    >
                        Features
                    </Link>
                    <Link
                        href="#pricing"
                        className={cn(
                            "text-sm text-[--color-muted]",
                            "hover:text-[--color-text] transition-colors duration-200",
                        )}
                    >
                        Pricing
                    </Link>
                    <Link
                        href="#about"
                        className={cn(
                            "text-sm text-[--color-muted]",
                            "hover:text-[--color-text] transition-colors duration-200",
                        )}
                    >
                        About
                    </Link>
                </nav>

                {/* Desktop auth buttons */}
                <div className="hidden md:flex items-center gap-3">
                    <Link href="/login">
                        <Button variant="ghost" size="sm">
                            Login
                        </Button>
                    </Link>
                    <Link href="/signup">
                        <Button size="sm">Get Started</Button>
                    </Link>
                </div>

                {/* Mobile menu toggle button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={cn(
                        "md:hidden flex flex-col gap-1.5",
                        "cursor-pointer p-1",
                    )}
                >
                    {/* NOTE: These three spans form the hamburger icon lines
              and animate into an X when the menu is open */}
                    <span
                        className={cn(
                            "w-6 h-0.5 bg-[--color-text]",
                            "transition-all duration-300",
                            isMenuOpen && "rotate-45 translate-y-2",
                        )}
                    />
                    <span
                        className={cn(
                            "w-6 h-0.5 bg-[--color-text]",
                            "transition-all duration-300",
                            isMenuOpen && "opacity-0",
                        )}
                    />
                    <span
                        className={cn(
                            "w-6 h-0.5 bg-[--color-text]",
                            "transition-all duration-300",
                            isMenuOpen && "-rotate-45 -translate-y-2",
                        )}
                    />
                </button>
            </div>

            {/* Mobile menu dropdown */}
            <div
                className={cn(
                    "md:hidden overflow-hidden",
                    "transition-all duration-300",
                    isMenuOpen ? "max-h-64" : "max-h-0",
                )}
            >
                <nav
                    className={cn(
                        "flex flex-col gap-1 px-4 pb-4",
                        "border-t border-[--color-border]",
                    )}
                >
                    <Link
                        href="#features"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                            "text-sm text-[--color-muted] py-2",
                            "hover:text-[--color-text] transition-colors duration-200",
                        )}
                    >
                        Features
                    </Link>
                    <Link
                        href="#pricing"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                            "text-sm text-[--color-muted] py-2",
                            "hover:text-[--color-text] transition-colors duration-200",
                        )}
                    >
                        Pricing
                    </Link>
                    <Link
                        href="#about"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                            "text-sm text-[--color-muted] py-2",
                            "hover:text-[--color-text] transition-colors duration-200",
                        )}
                    >
                        About
                    </Link>

                    {/* Mobile auth buttons */}
                    <div className="flex flex-col gap-2 mt-2">
                        <Link
                            href="/login"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <Button variant="outline" fullWidth>
                                Login
                            </Button>
                        </Link>
                        <Link
                            href="/signup"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <Button fullWidth>Get Started</Button>
                        </Link>
                    </div>
                </nav>
            </div>
        </header>
    );
}
