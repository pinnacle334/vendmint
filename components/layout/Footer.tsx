import Link from "next/link";
import { cn } from "@/lib/utils";

// Footer navigation links grouped by section
const footerLinks = {
    product: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Changelog", href: "#changelog" },
    ],
    company: [
        { label: "About", href: "#about" },
        { label: "Blog", href: "#blog" },
        { label: "Contact", href: "#contact" },
    ],
    legal: [
        { label: "Privacy Policy", href: "#privacy" },
        { label: "Terms of Service", href: "#terms" },
    ],
};

export default function Footer(): React.ReactElement {
    return (
        <footer
            className={cn(
                "w-full bg-[--color-surface]",
                "border-t border-[--color-border]",
                "mt-auto",
            )}
        >
            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Top section - logo and links */}
                <div className={cn("grid grid-cols-2 gap-8", "md:grid-cols-4")}>
                    {/* Brand column */}
                    <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
                        <Link
                            href="/"
                            className="text-xl font-bold text-[--color-primary]"
                        >
                            Vendmint
                        </Link>
                        <p className="text-sm text-[--color-muted] max-w-xs">
                            The simplest way for small businesses to sell online
                            and get paid — built for Nigeria.
                        </p>
                    </div>

                    {/* Product links */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-semibold text-[--color-text]">
                            Product
                        </h4>
                        <ul className="flex flex-col gap-2">
                            {footerLinks.product.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={cn(
                                            "text-sm text-[--color-muted]",
                                            "hover:text-[--color-text] transition-colors duration-200",
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company links */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-semibold text-[--color-text]">
                            Company
                        </h4>
                        <ul className="flex flex-col gap-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={cn(
                                            "text-sm text-[--color-muted]",
                                            "hover:text-[--color-text] transition-colors duration-200",
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal links */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-sm font-semibold text-[--color-text]">
                            Legal
                        </h4>
                        <ul className="flex flex-col gap-2">
                            {footerLinks.legal.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={cn(
                                            "text-sm text-[--color-muted]",
                                            "hover:text-[--color-text] transition-colors duration-200",
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom section - copyright */}
                <div
                    className={cn(
                        "flex flex-col md:flex-row items-center",
                        "justify-between gap-4 mt-12 pt-6",
                        "border-t border-[--color-border]",
                    )}
                >
                    <p className="text-xs text-[--color-muted]">
                        © {new Date().getFullYear()} Vendmint. All rights
                        reserved.
                    </p>
                    <p className="text-xs text-[--color-muted]">
                        Built with ❤️ for Nigerian businesses
                    </p>
                </div>
            </div>
        </footer>
    );
}
