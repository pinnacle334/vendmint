import { CartProvider } from "@/context/CartContext";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <CartProvider>{children}</CartProvider>;
}