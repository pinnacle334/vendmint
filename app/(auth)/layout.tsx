import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Vendmint - Auth",
    description: "Login or create your Vendmint account",
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}): React.ReactElement {
    return (
        <main
            className="
        min-h-screen
        bg-background
        flex items-center justify-center
        px-4 py-12
      "
        >
            {children}
        </main>
    );
}
